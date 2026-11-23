// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy, DOCUMENT_SOURCE, securityHeaderRules } from './security-headers.ts';

const options = { apiUrl: 'https://api.example.com/api', siteUrl: 'https://example.com' };

test('the CSP connects only to this site and the API', () => {
  const csp = contentSecurityPolicy(options);
  assert.match(csp, /connect-src 'self' https:\/\/api\.example\.com(;|$)/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /img-src 'self' data: blob:(;|$)/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test('HSTS only for an HTTPS site; nosniff everywhere; the page policies on pages only', () => {
  const names = (siteUrl: string, source: string) =>
    securityHeaderRules({ ...options, siteUrl })
      .find((rule) => rule.source === source)
      ?.headers.map((header) => header.key) ?? [];
  assert.deepEqual(names('https://example.com', '/:path*'), ['X-Content-Type-Options', 'Strict-Transport-Security']);
  assert.deepEqual(names('http://localhost:3000', '/:path*'), ['X-Content-Type-Options']);
  assert.deepEqual(names('http://localhost:3000', DOCUMENT_SOURCE), [
    'Content-Security-Policy',
    'Referrer-Policy',
    'X-Frame-Options',
    'Permissions-Policy',
  ]);
});

test('the page-only rule skips hashed static files and optimised images', () => {
  const pattern = new RegExp('^' + DOCUMENT_SOURCE + '$');
  assert.ok(pattern.test('/'));
  assert.ok(pattern.test('/projects/some-slug'));
  assert.ok(!pattern.test('/_next/static/chunks/app.js'));
  assert.ok(!pattern.test('/_next/image'));
});

test('a malformed API URL is left out rather than breaking the policy', () => {
  assert.match(contentSecurityPolicy({ apiUrl: 'not a url' }), /connect-src 'self'(;|$)/);
});
