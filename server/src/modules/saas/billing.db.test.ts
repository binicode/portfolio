// Run with `npm test` in server/. Billing against a real MongoDB (in memory)
// and a local stand-in for Stripe's API: the real Stripe SDK sends real
// requests, to a server here that records them and answers like Stripe.
// Covers checkout (customer created once, idempotently), the customer portal
// and deleting an account's Stripe customer. Emails land in the helper's
// outbox. The tests share one database and run in order.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import Stripe from 'stripe';
import { linkToken, startDatabaseApp, type DatabaseApp } from '../../test-support/database-app.js';
import { STRIPE_API_VERSION } from './stripe-events.js';

interface StripeCall {
  method: string;
  path: string;
  idempotencyKey: string | undefined;
  body: URLSearchParams;
}

let app: DatabaseApp;
let fakeStripe: Server;
const calls: StripeCall[] = [];
let session: string | undefined;

async function readBody(req: IncomingMessage): Promise<string> {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw;
}

/** Answers the four calls the API makes, shaped like Stripe's responses. */
function stripeAnswer(method: string, path: string, body: URLSearchParams): [number, object] {
  if (method === 'POST' && path === '/v1/customers') return [200, { id: 'cus_fake_1', object: 'customer', email: body.get('email') }];
  if (method === 'POST' && path === '/v1/checkout/sessions') {
    return [200, { id: 'cs_test_1', object: 'checkout.session', url: 'https://checkout.stripe.com/c/pay/cs_test_1' }];
  }
  if (method === 'POST' && path === '/v1/billing_portal/sessions') {
    return [200, { id: 'bps_1', object: 'billing_portal.session', url: 'https://billing.stripe.com/p/session/test_1' }];
  }
  const customer = /^\/v1\/customers\/([^/]+)$/.exec(path);
  if (method === 'DELETE' && customer) return [200, { id: customer[1], object: 'customer', deleted: true }];
  return [404, { error: { type: 'invalid_request_error', message: `No fake for ${method} ${path}` } }];
}

before(async () => {
  fakeStripe = createServer(async (req, res) => {
    const body = new URLSearchParams(await readBody(req));
    const path = (req.url ?? '/').split('?')[0];
    calls.push({ method: req.method ?? '', path, idempotencyKey: req.headers['idempotency-key'] as string | undefined, body });
    const [status, answer] = stripeAnswer(req.method ?? '', path, body);
    res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(answer));
  });
  fakeStripe.listen(0);
  await new Promise((resolve) => fakeStripe.once('listening', resolve));

  app = await startDatabaseApp({ STRIPE_SECRET_KEY: 'sk_test_fake', STRIPE_PRO_PRICE_ID: 'price_test_pro' });
  const { setStripeClientForTests } = await import('./stripe.service.js');
  setStripeClientForTests(
    new Stripe('sk_test_fake', {
      apiVersion: STRIPE_API_VERSION,
      host: '127.0.0.1',
      port: (fakeStripe.address() as AddressInfo).port,
      protocol: 'http',
      maxNetworkRetries: 0,
    }),
  );
});

after(async () => {
  await app?.stop();
  await new Promise((resolve) => fakeStripe?.close(resolve));
});

test('a confirmed account to subscribe with', async () => {
  const sent = app.outbox.length;
  await app.post('/api/saas/auth/register', { email: 'dana@example.com', password: 'dana-password-1' });
  const email = await app.nextEmail((m) => m.kind === 'verify-email', sent);
  const confirmed = await app.post('/api/saas/auth/verify-email', { token: linkToken(email), password: 'dana-password-1' });
  assert.equal(confirmed.status, 200);
  session = confirmed.cookie;
});

test('checkout creates the Stripe customer once, with an idempotency key, then reuses it', async () => {
  const first = await app.post('/api/saas/billing/checkout', {}, session);
  assert.equal(first.status, 200);
  assert.equal(first.body.url, 'https://checkout.stripe.com/c/pay/cs_test_1');

  const created = calls.filter((c) => c.method === 'POST' && c.path === '/v1/customers');
  assert.equal(created.length, 1);
  assert.match(created[0].idempotencyKey ?? '', /^customer-create\/[0-9a-f]{24}$/, 'keyed by the account id, no personal data');
  assert.equal(created[0].body.get('email'), 'dana@example.com');

  const checkout = calls.find((c) => c.path === '/v1/checkout/sessions');
  assert.equal(checkout?.body.get('customer'), 'cus_fake_1');
  assert.equal(checkout?.body.get('mode'), 'subscription');
  assert.equal(checkout?.body.get('line_items[0][price]'), 'price_test_pro');
  assert.equal(checkout?.body.get('success_url'), 'http://localhost:3000/saas/dashboard?checkout=success');

  assert.equal((await app.post('/api/saas/billing/checkout', {}, session)).status, 200);
  assert.equal(calls.filter((c) => c.path === '/v1/customers').length, 1, 'the stored customer is reused');
  assert.equal((await app.call('/api/saas/auth/me', {}, session)).body.hasBillingAccount, true);
});

test('the customer portal opens for that customer and returns to settings', async () => {
  const portal = await app.post('/api/saas/billing/portal', {}, session);
  assert.equal(portal.status, 200);
  assert.equal(portal.body.url, 'https://billing.stripe.com/p/session/test_1');
  const call = calls.find((c) => c.path === '/v1/billing_portal/sessions');
  assert.equal(call?.body.get('customer'), 'cus_fake_1');
  assert.equal(call?.body.get('return_url'), 'http://localhost:3000/saas/dashboard/settings');
});

test('deleting the account deletes its Stripe customer first', async () => {
  const deleted = await app.call('/api/saas/account', { method: 'DELETE', body: JSON.stringify({ password: 'dana-password-1' }) }, session);
  assert.equal(deleted.status, 200);
  assert.ok(calls.some((c) => c.method === 'DELETE' && c.path === '/v1/customers/cus_fake_1'));
  assert.equal((await app.call('/api/saas/auth/me', {}, session)).status, 401);
});
