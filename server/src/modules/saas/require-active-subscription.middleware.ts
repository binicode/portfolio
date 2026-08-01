import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../core/middleware/errorHandler.js';
import { SaasUserModel } from './saas-user.model.js';

/**
 * Guards a route behind an active Stripe subscription. Must run AFTER
 * requireAuth + requireRole('user'), since it depends on req.user
 * already being set.
 *
 * Queries subscriptionStatus fresh from the database rather than
 * trusting anything on the JWT — a subscription's status can change
 * via a Stripe webhook at any point during a token's 7-day life, so a
 * stale claim baked into the token would be wrong in either direction.
 */
export async function requireActiveSubscription(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(new AppError('Authentication required', 401));
    return;
  }

  try {
    const user = await SaasUserModel.findById(req.user.sub);

    if (!user) {
      next(new AppError('User not found', 404));
      return;
    }

    if (user.subscriptionStatus !== 'active') {
      next(new AppError('An active subscription is required to access this feature', 402));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}