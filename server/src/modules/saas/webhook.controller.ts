import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { verifyWebhookSignature } from './stripe.service.js';
import { SaasUserModel } from './saas-user.model.js';
import type { SubscriptionStatus } from './saas.types.js';

/**
 * Maps Stripe's own subscription statuses to our narrower
 * SubscriptionStatus. Anything not explicitly active/trialing or
 * canceled collapses to 'past_due' — the "block access" bucket.
 */
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'canceled') return 'canceled';
  return 'past_due';
}

async function updateSubscriptionByCustomerId(
  stripeCustomerId: string,
  status: SubscriptionStatus,
  stripeSubscriptionId?: string,
): Promise<void> {
  await SaasUserModel.findOneAndUpdate(
    { stripeCustomerId },
    {
      subscriptionStatus: status,
      ...(stripeSubscriptionId ? { stripeSubscriptionId } : {}),
    },
  );
}

/**
 * POST /api/saas/billing/webhook
 * Mounted directly in app.ts with express.raw() BEFORE the global
 * express.json() middleware — req.body here is a Buffer, not a parsed
 * object, which verifyWebhookSignature requires.
 */
export const postStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'];

  if (typeof signature !== 'string') {
    throw new AppError('Missing Stripe signature header', 400);
  }

  const event = verifyWebhookSignature(req.body as Buffer, signature);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (typeof session.customer === 'string' && typeof session.subscription === 'string') {
        await updateSubscriptionByCustomerId(session.customer, 'active', session.subscription);
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === 'string') {
        await updateSubscriptionByCustomerId(
          subscription.customer,
          mapStripeStatus(subscription.status),
          subscription.id,
        );
      }
      break;
    }

    default:
      // Other event types are received but intentionally ignored —
      // this app only cares about subscription status.
      break;
  }

  res.status(200).json({ received: true });
});