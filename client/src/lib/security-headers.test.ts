// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy, securityHeaders } from './security-headers.ts';

const options = { apiUrl: 'https://api.example.com/api', shopDomain: 'store.myshopify.com', siteUrl: 'https://example.com' };

test('the CSP connects only to this site, the API and the store', () => {
  const csp = contentSecurityPolicy(options);
  assert.match(csp, /connect-src 'self' https:\/\/api\.example\.com https:\/\/store\.myshopify\.com(;|$)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /img-src 'self' data: blob: https:\/\/cdn\.shopify\.com/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test('HSTS only for an HTTPS site; the hardening headers always', () => {
  const names = (siteUrl: string) => securityHeaders({ ...options, siteUrl }).map((header) => header.key);
  assert.ok(names('https://example.com').includes('Strict-Transport-Security'));
  assert.ok(!names('http://localhost:3000').includes('Strict-Transport-Security'));
  for (const name of ['Content-Security-Policy', 'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'Permissions-Policy']) {
    assert.ok(names('http://localhost:3000').includes(name), name);
  }
});

test('a malformed API URL is left out rather than breaking the policy', () => {
  assert.match(contentSecurityPolicy({ apiUrl: 'not a url', shopDomain: 'store.myshopify.com' }), /connect-src 'self' https:\/\/store\.myshopify\.com/);
});
