// Run with `npm test` in server/. The Creator Dashboard account lifecycle
// against a real MongoDB (in memory): confirming the address, sign-up that
// reveals nothing about existing accounts, password reset, the billing
// portal and account deletion. Emails land in the helper's outbox. The
// tests share one database and run in order. Sign-up and log-in share a
// limit of 10 attempts per 15 minutes per address (authLimiter); these
// tests use 8.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { linkToken, startDatabaseApp, type DatabaseApp } from '../../test-support/database-app.js';

let app: DatabaseApp;
let anaSession: string | undefined;
let benSession: string | undefined;

before(async () => {
  app = await startDatabaseApp();
});

after(async () => {
  await app?.stop();
});

const PASSWORD = 'first-password-1';

async function signUp(email: string, password = PASSWORD) {
  const sent = app.outbox.length;
  const response = await app.post('/api/saas/auth/register', { email, password });
  return { response, email: await app.nextEmail((m) => m.to === email.toLowerCase(), sent) };
}

test('a new address gets a confirmation link that signs in, once', async () => {
  const { response, email } = await signUp('ana@example.com');
  assert.equal(response.status, 202);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(email.kind, 'verify-email');
  assert.match(email.text, /http:\/\/localhost:3000\/saas\/verify-email#token=/);

  const token = linkToken(email);
  const verified = await app.post('/api/saas/auth/verify-email', { token });
  assert.equal(verified.status, 200);
  anaSession = verified.cookie;
  const me = await app.call('/api/saas/auth/me', {}, anaSession);
  assert.equal(me.body.emailVerified, true);

  const again = await app.post('/api/saas/auth/verify-email', { token });
  assert.equal(again.status, 400);
  assert.equal(again.body.error.message, 'This link has expired or was already used.');
});

test('signing up with a taken address answers the same and only tells its owner, at most hourly', async () => {
  const { response, email } = await signUp('ana@example.com', 'another-password-2');
  assert.equal(response.status, 202);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(email.kind, 'account-exists');
  assert.match(email.text, /\/saas\/forgot-password/);

  // The old password still works: the attempt changed nothing.
  assert.equal((await app.post('/api/saas/auth/login', { email: 'ana@example.com', password: PASSWORD })).status, 200);

  const sent = app.outbox.length;
  assert.equal((await app.post('/api/saas/auth/register', { email: 'ana@example.com', password: 'another-password-2' })).status, 202);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(app.outbox.length, sent, 'no second notice within the hour');
});

test('an unconfirmed account can sign in but not subscribe, and can ask for a new link once a minute', async () => {
  await signUp('ben@example.com');
  const login = await app.post('/api/saas/auth/login', { email: 'ben@example.com', password: PASSWORD });
  assert.equal(login.status, 200);
  benSession = login.cookie;
  assert.equal((await app.call('/api/saas/auth/me', {}, benSession)).body.emailVerified, false);

  const checkout = await app.post('/api/saas/billing/checkout', {}, benSession);
  assert.equal(checkout.status, 403);
  assert.equal(checkout.body.error.message, 'Confirm your email address before subscribing.');

  // The sign-up link was issued moments ago: too soon for another.
  assert.equal((await app.post('/api/saas/auth/verify-email/resend', {}, benSession)).status, 429);
});

test('a password reset: same answer for any address, a single-use link, every old session ends', async () => {
  const sent = app.outbox.length;
  const unknown = await app.post('/api/saas/auth/password/forgot', { email: 'nobody@example.com' });
  const known = await app.post('/api/saas/auth/password/forgot', { email: 'BEN@example.com' });
  assert.deepEqual(unknown, known);
  assert.equal(known.status, 202);

  const email = await app.nextEmail((m) => m.kind === 'reset-password', sent);
  assert.equal(email.to, 'ben@example.com');
  assert.ok(!app.outbox.slice(sent).some((m) => m.to === 'nobody@example.com'), 'nothing is sent to an unknown address');

  const oldSession = benSession;
  const token = linkToken(email);
  assert.equal((await app.post('/api/saas/auth/password/reset', { token, password: 'short' })).status, 400);

  const reset = await app.post('/api/saas/auth/password/reset', { token, password: 'second-password-2' });
  assert.equal(reset.status, 200);
  benSession = reset.cookie;
  const me = await app.call('/api/saas/auth/me', {}, benSession);
  assert.equal(me.status, 200);
  assert.equal(me.body.emailVerified, true, 'the reset link also confirms the address');
  assert.equal((await app.call('/api/saas/auth/me', {}, oldSession)).status, 401, 'older sessions end');

  assert.equal((await app.post('/api/saas/auth/password/reset', { token, password: 'third-password-3' })).status, 400, 'the link works once');
  assert.equal((await app.post('/api/saas/auth/password/reset', { token: 'not-a-token', password: 'third-password-3' })).status, 400);
  assert.equal((await app.post('/api/saas/auth/login', { email: 'ben@example.com', password: PASSWORD })).status, 401);
});

test('the billing portal needs a Stripe customer first', async () => {
  const portal = await app.post('/api/saas/billing/portal', {}, benSession);
  assert.equal(portal.status, 409);
  assert.equal((await app.post('/api/saas/billing/portal', {})).status, 401);
});

test('deleting an account needs its password, ends its session and frees the address', async () => {
  const session = benSession;
  const wrong = await app.call('/api/saas/account', { method: 'DELETE', body: JSON.stringify({ password: 'wrong-password' }) }, session);
  assert.equal(wrong.status, 403);
  assert.equal((await app.call('/api/saas/auth/me', {}, session)).status, 200, 'a wrong password deletes nothing');

  const deleted = await app.call('/api/saas/account', { method: 'DELETE', body: JSON.stringify({ password: 'second-password-2' }) }, session);
  assert.equal(deleted.status, 200);
  assert.match(deleted.cookie ?? '', /^saas_token=$/, 'the cookie is cleared');
  assert.equal((await app.call('/api/saas/auth/me', {}, session)).status, 401);

  const { email } = await signUp('ben@example.com');
  assert.equal(email.kind, 'verify-email', 'the address can be used for a new account');
});

test('an account with a Stripe customer stays when Stripe is unreachable', async () => {
  const { SaasUserModel } = await import('./saas-user.model.js');
  await SaasUserModel.updateOne({ email: 'ana@example.com' }, { $set: { stripeCustomerId: 'cus_test_123' } });
  assert.equal((await app.call('/api/saas/auth/me', {}, anaSession)).body.hasBillingAccount, true);

  // Stripe is not configured in tests: deleting the customer can't happen.
  const response = await app.call('/api/saas/account', { method: 'DELETE', body: JSON.stringify({ password: PASSWORD }) }, anaSession);
  assert.equal(response.status, 503);
  assert.equal((await app.call('/api/saas/auth/me', {}, anaSession)).status, 200, 'nothing was deleted');
});
