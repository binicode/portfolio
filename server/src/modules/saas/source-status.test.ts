// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './source-status.js';

const failWith = (statusCode?: number) => async () => {
  throw Object.assign(new Error('provider error'), statusCode === undefined ? {} : { statusCode });
};

test('no identifier: not_connected, and the provider is never called', async () => {
  let called = false;
  const result = await loadSource(undefined, 'GitHub', async () => {
    called = true;
    return 1;
  });
  assert.deepEqual(result, { data: null, status: 'not_connected' });
  assert.equal(called, false);
});

test('provider answers: connected, with its data', async () => {
  assert.deepEqual(await loadSource('octocat', 'GitHub', async (name) => ({ name })), { data: { name: 'octocat' }, status: 'connected' });
});

test('provider says the identifier does not exist (404): not_found', async () => {
  assert.deepEqual(await loadSource('no-such-user', 'GitHub', failWith(404)), { data: null, status: 'not_found' });
});

test('any other failure: unavailable', async () => {
  for (const fetcher of [failWith(502), failWith(401), failWith(), async () => Promise.reject(new TypeError('fetch failed'))]) {
    assert.deepEqual(await loadSource('octocat', 'GitHub', fetcher), { data: null, status: 'unavailable' });
  }
});
