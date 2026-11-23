import type { Request, Response } from 'express';
import { AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import { SaasUserModel, type SaasUserHydratedDocument } from './saas-user.model.js';
import { createBillingPortalSession, createStripeCustomer, createSubscriptionCheckoutSession } from './stripe.service.js';
import { checkoutReturnUrls } from './stripe-events.js';
import { primaryClientOrigin } from '../../core/config/origins.js';

async function signedInUser(req: Request): Promise<SaasUserHydratedDocument> {
  const user = await SaasUserModel.findById(req.user!.sub);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

/**
 * Returns the user's existing Stripe customer id, or creates one and
 * persists it onto the SaasUser document. This is the bridge between
 * stripe.service.ts's pure API calls and actual database state — kept
 * here rather than in the service file on purpose.
 */
async function getOrCreateStripeCustomerId(user: SaasUserHydratedDocument): Promise<string> {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const stripeCustomerId = await createStripeCustomer(user.email, user._id.toString());
  user.stripeCustomerId = stripeCustomerId;
  await user.save();

  return stripeCustomerId;
}

/**
 * POST /saas/billing/checkout
 * Starts a test-mode Checkout Session and returns the URL to redirect
 * to. This is hosted Checkout, not embedded — the client just does
 * window.location.href = url, no Stripe.js involved at all. Only for a
 * confirmed address: receipts and account email go there.
 */
export const postCreateCheckoutSession = async (req: Request, res: Response) => {
  const user = await signedInUser(req);
  if (!user.emailVerifiedAt) throw new AppError('Confirm your email address before subscribing.', 403);
  const stripeCustomerId = await getOrCreateStripeCustomerId(user);

  // Back to the SaaS dashboard (it was /dashboard, the admin area, and a
  // /billing page that doesn't exist).
  const { successUrl, cancelUrl } = checkoutReturnUrls(primaryClientOrigin(env.CLIENT_ORIGIN));
  const url = await createSubscriptionCheckoutSession(stripeCustomerId, successUrl, cancelUrl);

  res.status(200).json({ url });
};

/**
 * POST /saas/billing/portal
 * A Stripe customer portal session (card, invoices, cancelling), back to
 * the dashboard's settings afterwards. Only for an account that has been
 * through checkout.
 */
export const postCreatePortalSession = async (req: Request, res: Response) => {
  const user = await signedInUser(req);
  if (!user.stripeCustomerId) throw new AppError('There is no billing to manage yet.', 409);
  const returnUrl = `${primaryClientOrigin(env.CLIENT_ORIGIN)}/saas/dashboard/settings`;
  const url = await createBillingPortalSession(user.stripeCustomerId, returnUrl);
  res.status(200).json({ url });
};
