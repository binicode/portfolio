import Stripe from 'stripe';
import { env } from '../../core/config/env.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { verifyStripeEvent } from './stripe-events.js';

// What a visitor sees when Stripe fails. Stripe's own message (which can
// name prices, accounts or key fragments) is logged here, never returned.
const BILLING_UNAVAILABLE = 'Billing is unavailable right now. Try again in a minute.';

function billingError(context: string, error: unknown): AppError {
  console.error(`Stripe: ${context} failed`, error instanceof Error ? error.message : error);
  return new AppError(BILLING_UNAVAILABLE, 502);
}

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
    throw billingError('creating a customer', error);
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
      throw billingError('creating a Checkout Session', 'no checkout URL returned');
    }

    return session.url;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw billingError('creating a Checkout Session', error);
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
    return verifyStripeEvent(stripe.webhooks, rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError('Invalid webhook signature', 400);
  }
}