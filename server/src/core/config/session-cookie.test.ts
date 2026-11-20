import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearSessionCookieOptions, parseCookieDomain, SESSION_MAX_AGE_MS, sessionCookieOptions } from './session-cookie.js';

test('session cookies are httpOnly, SameSite=Strict, Secure in production, for 7 days', () => {
  assert.deepEqual(sessionCookieOptions({ production: true }), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_MAX_AGE_MS,
  });
  assert.equal(sessionCookieOptions({ production: false }).secure, false);
});

test('a cookie domain shares the session between the site and the API host', () => {
  assert.equal(sessionCookieOptions({ production: true, domain: 'example.com' }).domain, 'example.com');
  assert.equal(sessionCookieOptions({ production: true }).domain, undefined, 'host-only without one');
});

test('clearing uses the same name, domain and path, without an expiry', () => {
  const settings = { production: true, domain: 'example.com' };
  const { maxAge, ...set } = sessionCookieOptions(settings);
  assert.ok(maxAge);
  assert.deepEqual(clearSessionCookieOptions(settings), set);
});

test('COOKIE_DOMAIN accepts a bare domain only', () => {
  assert.equal(parseCookieDomain(undefined), undefined);
  assert.equal(parseCookieDomain('  '), undefined);
  assert.equal(parseCookieDomain('.Example.com'), 'example.com');
  assert.equal(parseCookieDomain('api.example.co.uk'), 'api.example.co.uk');
  assert.throws(() => parseCookieDomain('https://example.com'));
  assert.throws(() => parseCookieDomain('example.com/path'));
  assert.throws(() => parseCookieDomain('localhost'));
});
