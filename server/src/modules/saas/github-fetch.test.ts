// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGithubFetch } from './github-fetch.js';

/** A fake fetch that records the Authorization header of each call and answers with the given statuses in turn. */
function fakeFetch(statuses: number[]) {
  const calls: Array<string | undefined> = [];
  const impl = (async (_url: string, init?: RequestInit) => {
    calls.push((init?.headers as Record<string, string>)?.Authorization);
    return new Response('{}', { status: statuses[Math.min(calls.length - 1, statuses.length - 1)] });
  }) as typeof fetch;
  return { impl, calls };
}
const init = { headers: { Accept: 'application/vnd.github+json' } };

test('a working token is sent', async () => {
  const { impl, calls } = fakeFetch([200]);
  const response = await createGithubFetch(() => 'good-token', impl, () => {})('https://api.github.com/users/octocat', init);
  assert.equal(response.status, 200);
  assert.deepEqual(calls, ['Bearer good-token']);
});

test('a rejected token: retried without it, set aside afterwards, warned about once', async () => {
  const { impl, calls } = fakeFetch([401, 200, 200, 200]);
  const warnings: string[] = [];
  const githubFetch = createGithubFetch(() => 'revoked-token', impl, (message) => warnings.push(message));

  assert.equal((await githubFetch('https://api.github.com/users/octocat', init)).status, 200);
  assert.equal((await githubFetch('https://api.github.com/users/octocat/repos', init)).status, 200);
  assert.deepEqual(calls, ['Bearer revoked-token', undefined, undefined]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /GITHUB_API_TOKEN was rejected/);
});

test('no token: one plain request, and a 401 is passed through untouched', async () => {
  const { impl, calls } = fakeFetch([401]);
  const response = await createGithubFetch(() => undefined, impl, () => {})('https://api.github.com/users/octocat', init);
  assert.equal(response.status, 401);
  assert.deepEqual(calls, [undefined]);
});

test('other failures (404, 403, 5xx) are not retried', async () => {
  for (const status of [404, 403, 502]) {
    const { impl, calls } = fakeFetch([status]);
    const response = await createGithubFetch(() => 'good-token', impl, () => {})('https://api.github.com/users/x', init);
    assert.equal(response.status, status);
    assert.equal(calls.length, 1);
  }
});
