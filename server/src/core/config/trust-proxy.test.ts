// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTrustProxy } from './trust-proxy.js';

test('unset, 0 or false trusts no proxy (today\'s behaviour)', () => {
  for (const value of [undefined, '', '  ', '0', 'false', 'FALSE']) {
    assert.equal(parseTrustProxy(value), false, String(value));
  }
});

test('a hop count trusts that many proxies', () => {
  assert.equal(parseTrustProxy('1'), 1);
  assert.equal(parseTrustProxy(' 2 '), 2);
  assert.throws(() => parseTrustProxy('11'), /1 to 10/);
});

test('"true" is refused: any caller could pick its own IP', () => {
  assert.throws(() => parseTrustProxy('true'), /pick their own IP/);
  assert.throws(() => parseTrustProxy('TRUE'), /pick their own IP/);
});

test('addresses, subnets and presets are kept; anything else is refused', () => {
  assert.equal(parseTrustProxy('loopback'), 'loopback');
  assert.equal(parseTrustProxy('loopback, 10.0.0.0/8, fd00::/8'), 'loopback,10.0.0.0/8,fd00::/8');
  assert.equal(parseTrustProxy('203.0.113.7'), '203.0.113.7');
  assert.throws(() => parseTrustProxy('10.0.0.0/33'));
  assert.throws(() => parseTrustProxy('fd00::/129'));
  assert.throws(() => parseTrustProxy('my-proxy.example.com'));
  assert.throws(() => parseTrustProxy('loopback, nonsense'), /nonsense/);
  assert.throws(() => parseTrustProxy(','));
});
