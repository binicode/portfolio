import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { isDatabaseReady } from '../../core/config/db.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { SAAS_AUTH_COOKIE_NAME, sessionToken, signAccessToken, verifyAccessToken } from '../../core/middleware/auth.js';
import { endCustomerSession } from './customer-session.js';
import { SaasUserModel } from './saas-user.model.js';
import type { AuthResult } from './saas.types.js';
import { clearSessionCookieOptions, sessionCookieOptions } from '../../core/config/session-cookie.js';

const cookieSettings = () => ({ production: env.NODE_ENV === 'production', domain: env.COOKIE_DOMAIN });

const registerBodySchema = z.object({
  email: z.email({ error: 'Enter a valid email address.' }),
  password: z.string().min(8, { error: 'Use at least 8 characters.' }),
});

const loginBodySchema = z.object({
  email: z.email({ error: 'Enter a valid email address.' }),
  password: z.string().min(1),
});

const BCRYPT_SALT_ROUNDS = 10;

// Compared against when no account has the email, so a log-in takes as long
// for an unknown address as for a known one with a wrong password (the
// response time must not reveal which addresses have accounts).
const UNKNOWN_ACCOUNT_HASH = bcrypt.hashSync('no account has this password', BCRYPT_SALT_ROUNDS);

export const postRegister = async (req: Request, res: Response) => {
  const { email, password } = registerBodySchema.parse(req.body);

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await SaasUserModel.create({
    email,
    passwordHash,
    subscriptionStatus: 'none',
  });

  const token = signAccessToken('customer', { sub: user._id.toString(), email: user.email, ver: user.tokenVersion ?? 0 });

  res.cookie(SAAS_AUTH_COOKIE_NAME, token, sessionCookieOptions(cookieSettings()));

  const result: AuthResult = { success: true };
  res.status(201).json(result);
};

export const postLogin = async (req: Request, res: Response) => {
  const { email, password } = loginBodySchema.parse(req.body);

  const user = await SaasUserModel.findOne({ email: email.toLowerCase() });
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? UNKNOWN_ACCOUNT_HASH);

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signAccessToken('customer', { sub: user._id.toString(), email: user.email, ver: user.tokenVersion ?? 0 });

  res.cookie(SAAS_AUTH_COOKIE_NAME, token, sessionCookieOptions(cookieSettings()));

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
      if (!(error instanceof AppError)) console.warn('SaaS logout: could not revoke the session', error instanceof Error ? error.message : error);
    }
  }
  res.clearCookie(SAAS_AUTH_COOKIE_NAME, clearSessionCookieOptions(cookieSettings()));
  res.status(200).json({ success: true });
};

/**
 * GET /saas/auth/me
 * Now also returns the three aggregator source identifiers alongside
 * email and subscriptionStatus — this endpoint represents the current
 * user's full profile, and those fields are part of that profile, not
 * a separate concern deserving a duplicate read endpoint.
 */
export const getMe = async (req: Request, res: Response) => {
  const user = await SaasUserModel.findById(req.user!.sub);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    githubUsername: user.githubUsername,
    youtubeChannelId: user.youtubeChannelId,
    brandSearchQuery: user.brandSearchQuery,
  });
};
