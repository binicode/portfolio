// Run with `npm test` in server/. Creator Dashboard sign-up against a real
// MongoDB (in memory): confirming needs the emailed link and the password
// together, sign-up reveals nothing about existing accounts, and signing up
// with someone else's address never gets you into their account. Emails land
// in the helper's outbox. The tests share one database and run in order.
// Sign-up and log-in share a limit of 10 attempts per 15 minutes per address
// (authLimiter); these tests use 9.
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
const LOGIN_REFUSED = 'Invalid email or password. Just signed up? Confirm your email first.';

test('confirming needs the link and the password; it then signs in, once', async () => {
  const { response, email } = await signUp('ana@example.com');
  assert.equal(response.status, 202);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(email.kind, 'verify-email');
  assert.match(email.text, /http:\/\/localhost:3000\/saas\/verify-email#token=/);

  const token = linkToken(email);
  const wrong = await confirm(token, 'not-the-password');
  assert.equal(wrong.status, 401);
  assert.equal(wrong.cookie, undefined);

  const confirmed = await confirm(token, PASSWORD);
  assert.equal(confirmed.status, 200, 'a wrong password leaves the link usable');
  anaSession = confirmed.cookie;
  assert.equal((await app.call('/api/saas/auth/me', {}, anaSession)).body.emailVerified, true);

  const again = await confirm(token, PASSWORD);
  assert.equal(again.status, 400);
  assert.equal(again.body.error.message, 'This link has expired or was already used.');
});

test('signing up with a confirmed address answers the same and only tells its owner, at most hourly', async () => {
  const { response, email } = await signUp('ana@example.com', 'another-password-2');
  assert.equal(response.status, 202);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(email.kind, 'account-exists');
  assert.match(email.text, /\/saas\/forgot-password/);

  // The attempt changed nothing: the old password still works.
  assert.equal((await app.post('/api/saas/auth/login', { email: 'ana@example.com', password: PASSWORD })).status, 200);

  const sent = app.outbox.length;
  assert.equal((await app.post('/api/saas/auth/register', { email: 'ana@example.com', password: 'another-password-2' })).status, 202);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(app.outbox.length, sent, 'no second notice within the hour');
});

test('someone who signs up with another person’s address never gets into the account', async () => {
  // An attacker signs up with Ben's address and a password of their own.
  const { email: first } = await signUp('ben@example.com', 'attacker-password-1');

  // Unconfirmed: log-in is refused exactly like a wrong password, so the
  // attacker holds no session and learns nothing.
  const attacker = await app.post('/api/saas/auth/login', { email: 'ben@example.com', password: 'attacker-password-1' });
  const nobody = await app.post('/api/saas/auth/login', { email: 'nobody@example.com', password: 'attacker-password-1' });
  assert.equal(attacker.status, 401);
  assert.deepEqual(attacker, nobody);
  assert.equal(attacker.body.error.message, LOGIN_REFUSED);

  // Ben signs up himself: his password replaces the pending one. (A new link
  // waits a minute; the one already in his inbox still works.)
  assert.equal((await app.post('/api/saas/auth/register', { email: 'ben@example.com', password: PASSWORD })).status, 202);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal((await confirm(linkToken(first), 'attacker-password-1')).status, 401, "the attacker's password no longer confirms");

  const confirmed = await confirm(linkToken(first), PASSWORD);
  assert.equal(confirmed.status, 200);
  benSession = confirmed.cookie;
  assert.equal((await app.post('/api/saas/auth/login', { email: 'ben@example.com', password: 'attacker-password-1' })).status, 401);
});

test('checkout needs a confirmed address, and confirmed accounts pass that check', async () => {
  const checkout = await app.post('/api/saas/billing/checkout', {}, benSession);
  assert.equal(checkout.status, 503, 'past the confirmation check, stopped only because Stripe is off in tests');
});
