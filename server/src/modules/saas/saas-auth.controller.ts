import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { isDatabaseReady } from '../../core/config/db.js';
import { primaryClientOrigin } from '../../core/config/origins.js';
import { inBackground } from '../../core/background.js';
import { sendEmail } from '../../core/email/email.js';
import { accountExistsMessage, passwordResetMessage, verifyEmailMessage } from '../../core/email/messages.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { SAAS_AUTH_COOKIE_NAME, sessionToken, signAccessToken, verifyAccessToken } from '../../core/middleware/auth.js';
import { accountTokenSchemaInput, consumeAccountToken, deleteAccountTokens, issueAccountToken, lastIssuedAt, peekAccountToken } from './account-tokens.js';
import { endCustomerSession } from './customer-session.js';
import { SaasUserModel, type SaasUserHydratedDocument } from './saas-user.model.js';
import type { AuthResult } from './saas.types.js';
import { clearSessionCookieOptions, sessionCookieOptions } from '../../core/config/session-cookie.js';
import { errorFields, log } from '../../core/logger.js';

const cookieSettings = () => ({ production: env.NODE_ENV === 'production', domain: env.COOKIE_DOMAIN });

const emailSchema = z.email({ error: 'Enter a valid email address.' });
// bcrypt reads the first 72 bytes; the upper limit keeps hashing cheap.
const newPasswordSchema = z.string().min(8, { error: 'Use at least 8 characters.' }).max(128, { error: 'Use at most 128 characters.' });

const registerBodySchema = z.object({ email: emailSchema, password: newPasswordSchema });
const loginBodySchema = z.object({ email: emailSchema, password: z.string().min(1) });
const emailBodySchema = z.object({ email: emailSchema });
const verifyBodySchema = z.object({ token: accountTokenSchemaInput, password: z.string().min(1, { error: 'Enter your password.' }) });
const resetBodySchema = z.object({ token: accountTokenSchemaInput, password: newPasswordSchema });

const BCRYPT_SALT_ROUNDS = 10;

// Compared against when no account has the email, so a log-in takes as long
// for an unknown address as for a known one with a wrong password (the
// response time must not reveal which addresses have accounts).
const UNKNOWN_ACCOUNT_HASH = bcrypt.hashSync('no account has this password', BCRYPT_SALT_ROUNDS);

const LINK_INVALID = 'This link has expired or was already used.';
// One answer for an unknown address, a wrong password and an unconfirmed
// account, so log-in reveals nothing about which addresses have accounts.
const LOGIN_REFUSED = 'Invalid email or password. Just signed up? Confirm your email first.';
// A new link of the same kind at most this often, per account.
const RESEND_INTERVAL_MS = 60 * 1000;
// "You already have an account" at most this often, per account.
const EXISTING_ACCOUNT_NOTICE_INTERVAL_MS = 60 * 60 * 1000;
const DUPLICATE_KEY = 11000;

/** Where emailed links lead. Tokens travel in the fragment, which browsers never send to a server or in a Referer. */
function links() {
  const site = primaryClientOrigin(env.CLIENT_ORIGIN);
  return {
    verify: (token: string) => `${site}/saas/verify-email#token=${token}`,
    reset: (token: string) => `${site}/saas/reset-password#token=${token}`,
    login: `${site}/saas/login`,
    forgot: `${site}/saas/forgot-password`,
  };
}

function signIn(res: Response, user: SaasUserHydratedDocument): void {
  const token = signAccessToken('customer', { sub: user._id.toString(), email: user.email, ver: user.tokenVersion ?? 0 });
  res.cookie(SAAS_AUTH_COOKIE_NAME, token, sessionCookieOptions(cookieSettings()));
}

async function sendVerificationLink(user: SaasUserHydratedDocument): Promise<boolean> {
  const token = await issueAccountToken(user._id, 'verify-email');
  return sendEmail(verifyEmailMessage(user.email, links().verify(token)), randomUUID());
}

const issuedWithinInterval = (issuedAt: Date | null) => issuedAt !== null && Date.now() - issuedAt.getTime() < RESEND_INTERVAL_MS;

/**
 * POST /saas/auth/register
 * Answers the same, at once, whether or not the address has an account,
 * so sign-up can't be used to find out who has one. The work happens
 * after the response:
 * - a new address gets an unconfirmed account and a confirmation link;
 * - an unconfirmed account takes the new password and gets a new link (at
 *   most one a minute), so signing up again is how a lost link is replaced;
 * - a confirmed account's owner gets a note saying so (at most hourly).
 * Nobody is signed in here, and an unconfirmed account can't log in:
 * confirming needs both the emailed link and the password, so whoever
 * typed someone else's address can't get into the account that results.
 */
export const postRegister = async (req: Request, res: Response) => {
  const { email, password } = registerBodySchema.parse(req.body);
  res.status(202).json({ ok: true });

  inBackground('Sign-up', async () => {
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    try {
      const user = await SaasUserModel.create({ email, passwordHash, subscriptionStatus: 'none' });
      await sendVerificationLink(user);
    } catch (error) {
      if ((error as { code?: number }).code !== DUPLICATE_KEY) throw error;
      const pending = await SaasUserModel.findOneAndUpdate(
        { email: email.toLowerCase(), emailVerifiedAt: { $exists: false } },
        { $set: { passwordHash } },
        { returnDocument: 'after' },
      );
      if (pending) {
        if (!issuedWithinInterval(await lastIssuedAt(pending._id, 'verify-email'))) await sendVerificationLink(pending);
        return;
      }
      const noticeDue = new Date(Date.now() - EXISTING_ACCOUNT_NOTICE_INTERVAL_MS);
      const existing = await SaasUserModel.findOneAndUpdate(
        { email: email.toLowerCase(), $or: [{ existingAccountNoticeAt: { $exists: false } }, { existingAccountNoticeAt: { $lt: noticeDue } }] },
        { $set: { existingAccountNoticeAt: new Date() } },
      );
      if (existing) await sendEmail(accountExistsMessage(existing.email, links().login, links().forgot), randomUUID());
    }
  });
};

export const postLogin = async (req: Request, res: Response) => {
  const { email, password } = loginBodySchema.parse(req.body);

  const user = await SaasUserModel.findOne({ email: email.toLowerCase() });
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? UNKNOWN_ACCOUNT_HASH);

  if (!user || !passwordMatches || !user.emailVerifiedAt) {
    throw new AppError(LOGIN_REFUSED, 401);
  }

  signIn(res, user);
  const result: AuthResult = { success: true };
  res.status(200).json(result);
};

/**
 * POST /saas/auth/verify-email
 * Uses a confirmation link together with the account's password: the link
 * proves the inbox and the password proves who signed up, so both must
 * belong to the same person. A wrong password leaves the link usable.
 * Confirming ends any older session of the account and signs in.
 */
export const postVerifyEmail = async (req: Request, res: Response) => {
  const { token, password } = verifyBodySchema.parse(req.body);
  const userId = await peekAccountToken(token, 'verify-email');
  const user = userId ? await SaasUserModel.findById(userId) : null;
  if (!user) throw new AppError(LINK_INVALID, 400);
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('That password doesn’t match the one chosen at sign-up.', 401);
  }
  // Used up only now, atomically: a second request racing with the same link fails here.
  if (!(await consumeAccountToken(token, 'verify-email'))) throw new AppError(LINK_INVALID, 400);

  user.emailVerifiedAt ??= new Date();
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  signIn(res, user);
  const result: AuthResult = { success: true };
  res.status(200).json(result);
};

/**
 * POST /saas/auth/password/forgot
 * Answers the same, at once, for any address; an account's owner gets a
 * reset link (at most one a minute).
 */
export const postForgotPassword = async (req: Request, res: Response) => {
  const { email } = emailBodySchema.parse(req.body);
  res.status(202).json({ ok: true });

  inBackground('Password reset request', async () => {
    const user = await SaasUserModel.findOne({ email: email.toLowerCase() });
    if (!user) return;
    if (issuedWithinInterval(await lastIssuedAt(user._id, 'reset-password'))) return;
    const token = await issueAccountToken(user._id, 'reset-password');
    await sendEmail(passwordResetMessage(user.email, links().reset(token)), randomUUID());
  });
};

/**
 * POST /saas/auth/password/reset
 * Uses a reset link: sets the new password, signs out every device (the
 * token version goes up), removes the account's other links, confirms the
 * address (the link proves the inbox) and signs in.
 */
export const postResetPassword = async (req: Request, res: Response) => {
  const { token, password } = resetBodySchema.parse(req.body);
  const userId = await consumeAccountToken(token, 'reset-password');
  const user = userId ? await SaasUserModel.findById(userId) : null;
  if (!user) throw new AppError(LINK_INVALID, 400);

  user.passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  user.emailVerifiedAt ??= new Date();
  await user.save();
  await deleteAccountTokens(user._id);

  signIn(res, user);
  const result: AuthResult = { success: true };
  res.status(200).json(result);
};

/**
 * POST /saas/auth/logout
 * Clears the cookie and, when the request carries a current session, revokes
 * every token issued for the account so far (a copied token stops working
 * too). Without the database it can only clear the cookie.
 */
export const postLogout = async (req: Request, res: Response) => {
  const token = sessionToken(req, 'customer');
  // Without the database, revoking would wait for a connection; only clear the cookie.
  if (token && isDatabaseReady()) {
    try {
      await endCustomerSession(verifyAccessToken('customer', token));
    } catch (error) {
      if (!(error instanceof AppError)) log.warn('SaaS logout: could not revoke the session', errorFields(error));
    }
  }
  res.clearCookie(SAAS_AUTH_COOKIE_NAME, clearSessionCookieOptions(cookieSettings()));
  res.status(200).json({ success: true });
};

/**
 * GET /saas/auth/me
 * The signed-in account: email, whether it is confirmed, subscription and
 * billing state, and the dashboard's three source identifiers.
 */
export const getMe = async (req: Request, res: Response) => {
  const user = await SaasUserModel.findById(req.user!.sub);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    email: user.email,
    emailVerified: Boolean(user.emailVerifiedAt),
    subscriptionStatus: user.subscriptionStatus,
    // A Stripe customer exists, so the billing portal has something to show.
    hasBillingAccount: Boolean(user.stripeCustomerId),
    githubUsername: user.githubUsername,
    youtubeChannelId: user.youtubeChannelId,
    brandSearchQuery: user.brandSearchQuery,
  });
};
