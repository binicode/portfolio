// Run with `npm test` in server/. Session tokens: which tokens are accepted,
// for which kind of session, and the guard's version check. No database:
// the guard is given the account's current version directly. Each test file
// runs in its own process, so setting the environment here affects only
// this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response } from 'express';

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:1/unused';
process.env.ADMIN_EMAIL ??= 'admin@example.com';
process.env.ADMIN_PASSWORD_HASH ??= 'unused';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const SECRET = process.env.JWT_SECRET;

const jwt = (await import('jsonwebtoken')).default;
const { requireSession, sessionToken, signAccessToken, verifiedSessionKey, verifyAccessToken } = await import('./auth.js');
const { AppError } = await import('./errorHandler.js');

const CUSTOMER_ID = '507f1f77bcf86cd799439011';
const customerToken = (ver = 0) => signAccessToken('customer', { sub: CUSTOMER_ID, email: 'c@example.com', ver });
const adminToken = (ver = 0) => signAccessToken('admin', { sub: 'admin', ver });

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** Asserts that verification fails with a 401 and nothing more specific. */
function assertRefused(kind: 'admin' | 'customer', token: string) {
  assert.throws(
    () => verifyAccessToken(kind, token),
    (error) => error instanceof AppError && error.statusCode === 401,
  );
}

const fakeRequest = (init: { authorization?: string; cookies?: Record<string, string> }) =>
  ({ headers: init.authorization ? { authorization: init.authorization } : {}, cookies: init.cookies ?? {} }) as unknown as Request;

test('a token is accepted for its own kind of session, with its claims', () => {
  assert.deepEqual(verifyAccessToken('customer', customerToken(3)), { sub: CUSTOMER_ID, role: 'user', email: 'c@example.com', ver: 3 });
  assert.deepEqual(verifyAccessToken('admin', adminToken()), { sub: 'admin', role: 'admin', email: undefined, ver: 0 });
});

test('a token is refused for the other kind of session', () => {
  assertRefused('admin', customerToken());
  assertRefused('customer', adminToken());
});

test('a token signed with another secret is refused', () => {
  const token = jwt.sign({ sub: 'admin', role: 'admin', ver: 0 }, 'another-secret-that-is-at-least-32-characters', {
    algorithm: 'HS256',
    audience: 'portfolio-admin',
    issuer: 'portfolio-api',
  });
  assertRefused('admin', token);
});

test('only HS256 is accepted: an unsigned token or another algorithm is refused', () => {
  const claims = { sub: 'admin', role: 'admin', ver: 0, aud: 'portfolio-admin', iss: 'portfolio-api' };
  assertRefused('admin', `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(claims)}.`);
  assertRefused('admin', jwt.sign(claims, SECRET, { algorithm: 'HS512' }));
});

test('a token from another issuer, or without an audience, is refused', () => {
  const claims = { sub: 'admin', role: 'admin', ver: 0 };
  assertRefused('admin', jwt.sign(claims, SECRET, { algorithm: 'HS256', audience: 'portfolio-admin', issuer: 'someone-else' }));
  assertRefused('admin', jwt.sign(claims, SECRET, { algorithm: 'HS256', issuer: 'portfolio-api' }));
});

test('a token without a version, or with the wrong role for its audience, is refused', () => {
  const options = { algorithm: 'HS256', audience: 'portfolio-admin', issuer: 'portfolio-api' } as const;
  assertRefused('admin', jwt.sign({ sub: 'admin', role: 'admin' }, SECRET, options));
  assertRefused('admin', jwt.sign({ sub: 'admin', role: 'user', ver: 0 }, SECRET, options));
});

test('an expired token is refused as expired', () => {
  const token = jwt.sign({ sub: 'admin', role: 'admin', ver: 0 }, SECRET, {
    algorithm: 'HS256',
    audience: 'portfolio-admin',
    issuer: 'portfolio-api',
    expiresIn: -10,
  });
  assert.throws(() => verifyAccessToken('admin', token), { message: 'Token has expired' });
});

test('a Bearer header comes first; otherwise only the cookie of that kind is read', () => {
  const cookies = { admin_token: 'admin-cookie', saas_token: 'saas-cookie' };
  assert.equal(sessionToken(fakeRequest({ authorization: 'Bearer header-token', cookies }), 'customer'), 'header-token');
  assert.equal(sessionToken(fakeRequest({ cookies }), 'customer'), 'saas-cookie');
  assert.equal(sessionToken(fakeRequest({ cookies }), 'admin'), 'admin-cookie');
  assert.equal(sessionToken(fakeRequest({ cookies: { saas_token: 'saas-cookie' } }), 'admin'), null);
  assert.equal(sessionToken(fakeRequest({ authorization: 'Bearer ' }), 'admin'), null);
});

test('the guard admits a token issued under the current version and sets req.user', async () => {
  const guard = requireSession('customer', async () => 2);
  const req = fakeRequest({ authorization: `Bearer ${customerToken(2)}` });
  let called = false;
  await guard(req, {} as Response, () => {
    called = true;
  });
  assert.ok(called);
  assert.equal(req.user?.sub, CUSTOMER_ID);
});

test('the guard refuses a revoked token, a deleted account and a missing token', async () => {
  const next = () => assert.fail('the guard must not pass the request on');
  const refused = { statusCode: 401 };
  // Issued under version 0; the account is at version 1 (it signed out since).
  await assert.rejects(requireSession('customer', async () => 1)(fakeRequest({ authorization: `Bearer ${customerToken(0)}` }), {} as Response, next), {
    ...refused,
    message: 'Your session has ended. Please sign in again.',
  });
  await assert.rejects(requireSession('customer', async () => null)(fakeRequest({ authorization: `Bearer ${customerToken(0)}` }), {} as Response, next), refused);
  await assert.rejects(requireSession('customer', async () => 0)(fakeRequest({}), {} as Response, next), refused);
});

test('the rate-limit key names the account of a valid token, and nothing else', () => {
  assert.equal(verifiedSessionKey(fakeRequest({ authorization: `Bearer ${customerToken()}` })), `user:${CUSTOMER_ID}`);
  assert.equal(verifiedSessionKey(fakeRequest({ cookies: { admin_token: adminToken() } })), 'admin:admin');
  assert.equal(verifiedSessionKey(fakeRequest({ authorization: 'Bearer not-a-token' })), null);
  assert.equal(verifiedSessionKey(fakeRequest({})), null);
});
