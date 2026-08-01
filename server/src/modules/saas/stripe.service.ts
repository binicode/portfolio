import Stripe from 'stripe';
import { env } from '../../core/config/env.js';
import { AppError } from '../../core/middleware/errorHandler.js';

// No apiVersion pinned deliberately — see file-level note in chat.
// Omitting it means the SDK uses this Stripe account's own current
// default API version, which is always valid for that account.
const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? '');

/**
 * Creates a new Stripe Customer. Does NOT persist the returned id
 * anywhere — this file only talks to the Stripe API, never to
 * MongoDB. The caller (billing.controller.ts) is responsible for
 * saving it onto the SaasUser document.
 */
export async function createStripeCustomer(email: string): Promise<string> {
  try {
    const customer = await stripe.customers.create({ email });
    return customer.id;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? `Stripe error: ${error.message}` : 'Failed to create Stripe customer',
      502,
    );
  }
}

/**
 * Creates a test-mode Checkout Session in subscription mode for the
 * single Pro price this MVP sells. Hardcodes STRIPE_PRO_PRICE_ID
 * rather than accepting a priceId parameter — see file-level note on
 * why a single-tier MVP doesn't need that flexibility yet.
 */
export async function createSubscriptionCheckoutSession(
  stripeCustomerId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  if (!env.STRIPE_PRO_PRICE_ID) {
    throw new AppError('Server misconfiguration: STRIPE_PRO_PRICE_ID is not set', 500);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new AppError('Stripe did not return a checkout URL', 502);
    }

    return session.url;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof Error ? `Stripe error: ${error.message}` : 'Failed to create checkout session',
      502,
    );
  }
}

/**
 * Verifies a webhook payload's signature and returns the parsed event.
 * Requires the RAW request body (a Buffer), not JSON-parsed — Stripe
 * signs the exact bytes it sent. If express.json() has already parsed
 * and re-serialized the body before this runs, verification fails even
 * for a genuine, unmodified request from Stripe. Ensuring this
 * function receives the untouched raw body is the webhook route's
 * responsibility, not this file's.
 */
export function verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError('Server misconfiguration: STRIPE_WEBHOOK_SECRET is not set', 500);
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    throw new AppError(
      error instanceof Error
        ? `Webhook signature verification failed: ${error.message}`
        : 'Invalid webhook signature',
      400,
    );
  }
}