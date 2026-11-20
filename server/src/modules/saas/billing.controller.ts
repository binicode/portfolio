import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import { SaasUserModel } from './saas-user.model.js';
import { createStripeCustomer, createSubscriptionCheckoutSession } from './stripe.service.js';
import { checkoutReturnUrls } from './stripe-events.js';
import { primaryClientOrigin } from '../../core/config/origins.js';

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

  // Back to the SaaS dashboard (it was /dashboard, the admin area, and a
  // /billing page that doesn't exist).
  const { successUrl, cancelUrl } = checkoutReturnUrls(primaryClientOrigin(env.CLIENT_ORIGIN));
  const url = await createSubscriptionCheckoutSession(stripeCustomerId, successUrl, cancelUrl);

  res.status(200).json({ url });
});
