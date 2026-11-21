// Stripe webhook handling with locally signed events: no network, no keys.
// Run with `npm test` in server/.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {
  checkoutReturnUrls,
  handleStripeEvent,
  subscriptionUpdateFromEvent,
  verifyStripeEvent,
  type SubscriptionUpdate,
  type WebhookStore,
} from './stripe-events.js';
import type { SubscriptionStatus } from './saas.types.js';

// A client is only used for its webhook helpers; it never calls the API.
const stripe = new Stripe('sk_test_local_only');
const SECRET = 'whsec_local_test_secret';

let counter = 0;
function event(type: string, object: Record<string, unknown>, created: number): Stripe.Event {
  counter += 1;
  return { id: `evt_${counter}`, object: 'event', type, created, data: { object } } as unknown as Stripe.Event;
}
const subscription = (status: string, customer = 'cus_1') => ({ id: 'sub_1', object: 'subscription', customer, status });
const checkout = (paymentStatus: string, customer = 'cus_1') => ({
  id: 'cs_1',
  object: 'checkout.session',
  mode: 'subscription',
  payment_status: paymentStatus,
  customer,
  subscription: 'sub_1',
});

/** The store with MongoDB's semantics, in memory. */
function memoryStore(failApplyOnce = false) {
  const seen = new Set<string>();
  const users = new Map<string, { status: SubscriptionStatus; eventAt?: Date }>([['cus_1', { status: 'none' }]]);
  let fail = failApplyOnce;
  const store: WebhookStore = {
    async claim(id) {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    },
    async release(id) {
      seen.delete(id);
    },
    async apply(update: SubscriptionUpdate) {
      if (fail) {
        fail = false;
        throw new Error('database unavailable');
      }
      const user = users.get(update.stripeCustomerId);
      if (!user || (user.eventAt && user.eventAt > update.eventAt)) return false;
      users.set(update.stripeCustomerId, { status: update.status, eventAt: update.eventAt });
      return true;
    },
  };
  return { store, users };
}

test('a correctly signed webhook verifies; a tampered body or wrong secret does not', () => {
  const payload = JSON.stringify(event('customer.subscription.updated', subscription('active'), 1_700_000_000));
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });

  const verified = verifyStripeEvent(stripe.webhooks, Buffer.from(payload), header, SECRET);
  assert.equal(verified.type, 'customer.subscription.updated');

  const tampered = payload.replace('"active"', '"canceled"');
  assert.throws(() => verifyStripeEvent(stripe.webhooks, Buffer.from(tampered), header, SECRET));
  assert.throws(() => verifyStripeEvent(stripe.webhooks, Buffer.from(payload), header, 'whsec_another_secret'));
  assert.throws(() => verifyStripeEvent(stripe.webhooks, Buffer.from(payload), 't=1,v1=forged', SECRET));
});

test('only a paid subscription checkout grants access', () => {
  const paid = subscriptionUpdateFromEvent(event('checkout.session.completed', checkout('paid'), 100));
  assert.deepEqual(paid && { status: paid.status, customer: paid.stripeCustomerId }, { status: 'active', customer: 'cus_1' });

  assert.equal(subscriptionUpdateFromEvent(event('checkout.session.completed', checkout('unpaid'), 100)), null);
  assert.equal(
    subscriptionUpdateFromEvent(event('checkout.session.completed', { ...checkout('paid'), mode: 'payment' }, 100)),
    null,
  );
  assert.equal(subscriptionUpdateFromEvent(event('invoice.paid', {}, 100)), null, 'other events are ignored');
});

test('subscription states map to access', () => {
  const status = (type: string, s: string) => subscriptionUpdateFromEvent(event(type, subscription(s), 100))?.status;
  assert.equal(status('customer.subscription.updated', 'active'), 'active');
  assert.equal(status('customer.subscription.updated', 'trialing'), 'active');
  assert.equal(status('customer.subscription.updated', 'past_due'), 'past_due');
  assert.equal(status('customer.subscription.updated', 'unpaid'), 'past_due');
  assert.equal(status('customer.subscription.updated', 'incomplete'), 'past_due');
  assert.equal(status('customer.subscription.deleted', 'canceled'), 'canceled');
});

test('a redelivered event is processed once', async () => {
  const { store, users } = memoryStore();
  const paid = event('checkout.session.completed', checkout('paid'), 100);
  assert.equal(await handleStripeEvent(paid, store), 'applied');
  assert.equal(await handleStripeEvent(paid, store), 'duplicate');
  assert.equal(users.get('cus_1')?.status, 'active');
});

test('a late event cannot undo a later one (out-of-order delivery)', async () => {
  const { store, users } = memoryStore();
  const activated = event('customer.subscription.updated', subscription('active'), 100);
  const canceled = event('customer.subscription.deleted', subscription('canceled'), 200);
  const lateCheckout = event('checkout.session.completed', checkout('paid'), 90);

  assert.equal(await handleStripeEvent(canceled, store), 'applied');
  assert.equal(await handleStripeEvent(activated, store), 'skipped');
  assert.equal(await handleStripeEvent(lateCheckout, store), 'skipped');
  assert.equal(users.get('cus_1')?.status, 'canceled');
});

test('a failure releases the event, so Stripe’s retry is processed', async () => {
  const { store, users } = memoryStore(true);
  const paid = event('checkout.session.completed', checkout('paid'), 100);
  await assert.rejects(handleStripeEvent(paid, store), /database unavailable/);
  assert.equal(await handleStripeEvent(paid, store), 'applied');
  assert.equal(users.get('cus_1')?.status, 'active');
});

test('an event for an unknown customer changes nothing', async () => {
  const { store, users } = memoryStore();
  assert.equal(await handleStripeEvent(event('customer.subscription.updated', subscription('active', 'cus_x'), 100), store), 'skipped');
  assert.equal(users.has('cus_x'), false);
});

test('Checkout returns to the SaaS dashboard, not the admin', () => {
  assert.deepEqual(checkoutReturnUrls('https://example.com/'), {
    successUrl: 'https://example.com/saas/dashboard?checkout=success',
    cancelUrl: 'https://example.com/saas/dashboard?checkout=cancelled',
  });
});
