import type Stripe from 'stripe';
import type { SubscriptionStatus } from './saas.types.js';

/**
 * What a Stripe webhook means for a subscriber, and how it is applied
 * safely. Pure: no SDK client, config or database imports, so it is tested
 * on its own with locally signed events (stripe-events.test.ts). The
 * MongoDB side of the store lives in webhook.controller.ts.
 *
 * Stripe delivers events at least once and in no guaranteed order, so:
 * - each event id is processed once (a redelivery is acknowledged and
 *   skipped);
 * - an update applies only if no later event has already been applied to
 *   that customer (a late "active" can't undo a cancellation);
 * - entitlement is only ever written here, from verified events. The API
 *   reads it from the database on every request
 *   (require-active-subscription.middleware.ts), never from the client.
 */

/**
 * The Stripe API version every request uses (stripe.service.ts), pinned so
 * an SDK update never changes it silently. Create the webhook endpoint at
 * this same version (Dashboard > Developers > Webhooks), so the events it
 * sends have the shapes this code and the SDK's types expect.
 */
export const STRIPE_API_VERSION = '2026-11-18.endive';

export interface SubscriptionUpdate {
  stripeCustomerId: string;
  status: SubscriptionStatus;
  stripeSubscriptionId: string;
  /** When Stripe created the event. Later events win. */
  eventAt: Date;
}

/**
 * Stripe's subscription statuses, narrowed to ours. Anything not active,
 * trialing or canceled blocks access ('past_due').
 */
export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'canceled') return 'canceled';
  return 'past_due';
}

const customerId = (customer: string | { id: string } | null): string | null =>
  typeof customer === 'string' ? customer : (customer?.id ?? null);

/** The change an event makes, or null for events this app ignores. */
export function subscriptionUpdateFromEvent(event: Stripe.Event): SubscriptionUpdate | null {
  const eventAt = new Date(event.created * 1000);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      // Only a paid subscription checkout grants access here. A delayed
      // payment method completes the session before the money arrives;
      // its subscription events carry the real state when it does.
      if (session.mode !== 'subscription') return null;
      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return null;
      const customer = customerId(session.customer);
      const subscription = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (!customer || !subscription) return null;
      return { stripeCustomerId: customer, status: 'active', stripeSubscriptionId: subscription, eventAt };
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customer = customerId(subscription.customer);
      if (!customer) return null;
      return {
        stripeCustomerId: customer,
        status: event.type === 'customer.subscription.deleted' ? 'canceled' : mapStripeStatus(subscription.status),
        stripeSubscriptionId: subscription.id,
        eventAt,
      };
    }

    default:
      return null;
  }
}

/** Persistence for webhook processing (MongoDB in production, a Map in tests). */
export interface WebhookStore {
  /** Records the event id. False if it was already recorded: a redelivery. */
  claim(eventId: string): Promise<boolean>;
  /** Forgets the event id after a failure, so Stripe's retry is processed. */
  release(eventId: string): Promise<void>;
  /**
   * Applies the update unless the customer already has a later event
   * applied (or no account has this customer id). True if it was applied.
   */
  apply(update: SubscriptionUpdate): Promise<boolean>;
}

export type WebhookOutcome = 'applied' | 'skipped' | 'ignored' | 'duplicate';

export async function handleStripeEvent(event: Stripe.Event, store: WebhookStore): Promise<WebhookOutcome> {
  if (!(await store.claim(event.id))) return 'duplicate';
  try {
    const update = subscriptionUpdateFromEvent(event);
    if (!update) return 'ignored';
    return (await store.apply(update)) ? 'applied' : 'skipped';
  } catch (error) {
    await store.release(event.id);
    throw error;
  }
}

/**
 * The MongoDB filter that makes an update conditional on ordering: the
 * customer's stored event time must be absent or not later than this
 * event's. Applied in one atomic update, so concurrent deliveries can't
 * race past it.
 */
export function subscriptionUpdateFilter(update: SubscriptionUpdate) {
  return {
    stripeCustomerId: update.stripeCustomerId,
    $or: [{ subscriptionEventAt: { $exists: false } }, { subscriptionEventAt: null }, { subscriptionEventAt: { $lte: update.eventAt } }],
  };
}

/** Verifies a webhook against the raw body and returns the event; throws if the signature is wrong. */
export function verifyStripeEvent(
  webhooks: Pick<Stripe['webhooks'], 'constructEvent'>,
  rawBody: Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  return webhooks.constructEvent(rawBody, signature, secret);
}

/**
 * Where Stripe Checkout sends the visitor back: the SaaS dashboard, which
 * shows the dashboard once the webhook has unlocked it. The first origin
 * of CLIENT_ORIGIN is the public site.
 */
export function checkoutReturnUrls(clientOrigin: string): { successUrl: string; cancelUrl: string } {
  const base = clientOrigin.replace(/\/+$/, '');
  return {
    successUrl: `${base}/saas/dashboard?checkout=success`,
    cancelUrl: `${base}/saas/dashboard?checkout=cancelled`,
  };
}
