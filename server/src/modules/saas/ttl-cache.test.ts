// Run with `npm test` in server/. The provider-answer cache behind the
// Creator Dashboard (aggregator.service.ts), with a hand-moved clock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from './ttl-cache.js';

function clock() {
  let now = 1_000_000;
  return { now: () => now, advance: (ms: number) => (now += ms) };
}

test('an answer is reused until it is 10 minutes old, then fetched again', async () => {
  const time = clock();
  const cache = new TtlCache<number>(10 * 60 * 1000, 10, time.now);
  let loads = 0;
  const load = async () => ++loads;

  assert.deepEqual(await cache.get('octocat', load), { value: 1, at: 1_000_000 });
  time.advance(9 * 60 * 1000);
  assert.equal((await cache.get('octocat', load)).value, 1, 'still fresh');
  time.advance(60 * 1000);
  assert.equal((await cache.get('octocat', load)).value, 2, 'expired: fetched again');
  assert.equal(loads, 2);
});

test('a failure is not kept: the next request tries again', async () => {
  const cache = new TtlCache<string>(60_000, 10);
  await assert.rejects(cache.get('ghost', async () => Promise.reject(new Error('provider down'))));
  assert.equal((await cache.get('ghost', async () => 'back')).value, 'back');
});

test('requests for the same key while it loads share one fetch', async () => {
  const cache = new TtlCache<string>(60_000, 10);
  let loads = 0;
  let release!: () => void;
  const load = () => {
    loads++;
    return new Promise<string>((resolve) => (release = () => resolve('stats')));
  };
  const first = cache.get('octocat', load);
  const second = cache.get('octocat', load);
  release();
  assert.deepEqual(await Promise.all([first, second]).then((r) => r.map((e) => e.value)), ['stats', 'stats']);
  assert.equal(loads, 1);
});

test('past the size limit, the oldest stored key goes first', async () => {
  const cache = new TtlCache<string>(60_000, 2);
  let loads = 0;
  const load = (value: string) => async () => {
    loads++;
    return value;
  };
  await cache.get('a', load('a'));
  await cache.get('b', load('b'));
  await cache.get('c', load('c')); // 'a' goes
  assert.equal(loads, 3);
  await cache.get('b', load('b'));
  assert.equal(loads, 3, "'b' was kept");
  await cache.get('a', load('a'));
  assert.equal(loads, 4, "'a' had to be fetched again");
});
