// Run with `npm test` in server/. A Creator Dashboard account after sign-up,
// against a real MongoDB (in memory): password reset, the billing portal
// and account deletion. Emails land in the helper's outbox. The tests share
// one database and run in order.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { linkToken, startDatabaseApp, type DatabaseApp } from '../../test-support/database-app.js';

let app: DatabaseApp;

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

const confirm = (token: string, password: string) => app.post('/api/saas/auth/verify-email', { token, password });
let anaSession: string | undefined;
let benSession: string | undefined;

/** Signs up and confirms, like a person following the emailed link; returns the session. */
async function confirmedAccount(address: string, password = PASSWORD): Promise<string | undefined> {
  const { email } = await signUp(address, password);
  const confirmed = await confirm(linkToken(email), password);
  assert.equal(confirmed.status, 200);
  return confirmed.cookie;
}

test('two confirmed accounts to work with', async () => {
  anaSession = await confirmedAccount('ana@example.com');
  benSession = await confirmedAccount('ben@example.com');
  assert.equal((await app.call('/api/saas/auth/me', {}, benSession)).body.emailVerified, true);
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
  assert.equal((await app.call('/api/saas/auth/me', {}, benSession)).status, 200);
  assert.equal((await app.call('/api/saas/auth/me', {}, oldSession)).status, 401, 'older sessions end');

  assert.equal((await app.post('/api/saas/auth/password/reset', { token, password: 'third-password-3' })).status, 400, 'the link works once');
  assert.equal((await app.post('/api/saas/auth/password/reset', { token: 'not-a-token', password: 'third-password-3' })).status, 400);
  assert.equal((await app.post('/api/saas/auth/login', { email: 'ben@example.com', password: PASSWORD })).status, 401);
});

test('a reset also confirms an unconfirmed account: the way back for a lost link', async () => {
  await signUp('cara@example.com');
  const sent = app.outbox.length;
  await app.post('/api/saas/auth/password/forgot', { email: 'cara@example.com' });
  const email = await app.nextEmail((m) => m.kind === 'reset-password' && m.to === 'cara@example.com', sent);
  const reset = await app.post('/api/saas/auth/password/reset', { token: linkToken(email), password: 'cara-password-2' });
  assert.equal(reset.status, 200);
  assert.equal((await app.call('/api/saas/auth/me', {}, reset.cookie)).body.emailVerified, true);
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
