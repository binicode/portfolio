import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corsOriginCheck, parseClientOrigins, primaryClientOrigin } from './origins.js';

test('one origin or a comma-separated list, normalised and deduplicated', () => {
  assert.deepEqual(parseClientOrigins('http://localhost:3000'), ['http://localhost:3000']);
  assert.deepEqual(parseClientOrigins(' https://example.com/ , https://preview.example.com,https://example.com'), [
    'https://example.com',
    'https://preview.example.com',
  ]);
  assert.equal(primaryClientOrigin('https://example.com, https://preview.example.com'), 'https://example.com');
});

test('paths, other schemes and empty lists are rejected', () => {
  assert.throws(() => parseClientOrigins('https://example.com/app'), /without a path/);
  assert.throws(() => parseClientOrigins('ftp://example.com'), /http or https/);
  assert.throws(() => parseClientOrigins('example.com'), /not a URL/);
  assert.throws(() => parseClientOrigins(' , '), /at least one/);
});

test('CORS allows listed origins only, and requests without an Origin header', () => {
  const check = corsOriginCheck(['https://example.com']);
  const answer = (origin: string | undefined) => {
    let allowed: boolean | undefined;
    check(origin, (_error, allow) => (allowed = allow));
    return allowed;
  };
  assert.equal(answer('https://example.com'), true);
  assert.equal(answer('https://evil.example.net'), false);
  assert.equal(answer('https://example.com.evil.net'), false);
  assert.equal(answer(undefined), true);
});
