import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { clearSessionCookieOptions } from '../../core/config/session-cookie.js';
import { SAAS_AUTH_COOKIE_NAME } from '../../core/middleware/auth.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { deleteAccountTokens } from './account-tokens.js';
import { SaasUserModel } from './saas-user.model.js';
import { deleteStripeCustomer } from './stripe.service.js';

const deleteBodySchema = z.object({ password: z.string().min(1, { error: 'Enter your password.' }) });

/**
 * DELETE /saas/account
 * Deletes the signed-in account, after its password is entered again.
 * Stripe first: deleting the customer there cancels any subscription at
 * once, so nothing is charged for an account that no longer exists. If
 * Stripe can't be reached the account stays, and the person can try again.
 * Then the account and its outstanding links are deleted here, and the
 * session cookie is cleared (the account's tokens can no longer verify:
 * the session check finds no account).
 */
export const deleteAccount = async (req: Request, res: Response) => {
  const { password } = deleteBodySchema.parse(req.body);
  const user = await SaasUserModel.findById(req.user!.sub);
  if (!user) throw new AppError('User not found', 404);
  if (!(await bcrypt.compare(password, user.passwordHash))) throw new AppError('That password is not right.', 403);

  if (user.stripeCustomerId) await deleteStripeCustomer(user.stripeCustomerId);
  await deleteAccountTokens(user._id);
  await SaasUserModel.deleteOne({ _id: user._id });

  res.clearCookie(
    SAAS_AUTH_COOKIE_NAME,
    clearSessionCookieOptions({ production: env.NODE_ENV === 'production', domain: env.COOKIE_DOMAIN }),
  );
  res.status(200).json({ success: true });
};
