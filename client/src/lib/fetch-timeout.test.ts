import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SERVER_FETCH_TIMEOUT_MS, withTimeout } from './fetch-timeout.ts';

test('adds a timeout signal and keeps the other options', () => {
  const init = withTimeout({ method: 'GET', next: { revalidate: 60 } } as RequestInit & { next: { revalidate: number } });
  assert.ok(init.signal instanceof AbortSignal);
  assert.equal(init.method, 'GET');
  assert.deepEqual(init.next, { revalidate: 60 });
  assert.equal(SERVER_FETCH_TIMEOUT_MS, 10_000);
});

test("a caller's own signal is kept", () => {
  const { signal } = new AbortController();
  assert.equal(withTimeout({ signal }).signal, signal);
});

test('the signal aborts once the time is up', async () => {
  const { signal } = withTimeout({} as RequestInit, 20);
  assert.equal(signal?.aborted, false);
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(signal?.aborted, true);
  assert.equal((signal?.reason as Error).name, 'TimeoutError');
});
