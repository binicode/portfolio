import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import { SaasUserModel } from './saas-user.model.js';
import { createStripeCustomer, createSubscriptionCheckoutSession } from './stripe.service.js';

/**
 * Returns the user's existing Stripe customer id, or creates one and
 * persists it onto the SaasUser document. This is the bridge between
 * stripe.service.ts's pure API calls and actual database state — kept
 * here rather than in the service file on purpose.
 */
async function getOrCreateStripeCustomerId(userId: string): Promise<string> {
  const user = await SaasUserModel.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripeCustomerId = await createStripeCustomer(user.email);
  user.stripeCustomerId = stripeCustomerId;
  await user.save();

  return stripeCustomerId;
}

/**
 * POST /saas/billing/checkout
 * Starts a test-mode Checkout Session and returns the URL to redirect
 * to. This is hosted Checkout, not embedded — the client just does
 * window.location.href = url, no Stripe.js involved at all.
 */
export const postCreateCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const stripeCustomerId = await getOrCreateStripeCustomerId(req.user!.sub);

  const url = await createSubscriptionCheckoutSession(
    stripeCustomerId,
    `${env.CLIENT_ORIGIN}/dashboard?checkout=success`,
    `${env.CLIENT_ORIGIN}/billing?checkout=cancelled`,
  );

  res.status(200).json({ url });
});
