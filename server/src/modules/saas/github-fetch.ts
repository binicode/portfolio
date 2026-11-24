import { log } from '../../core/logger.js';
/**
 * fetch for the GitHub API, with the server's token when it works and
 * without it when GitHub rejects it. Pure (the token, fetch and logger are
 * passed in), so it is unit-tested.
 *
 * The token only raises GitHub's rate limit (5,000 instead of 60 requests an
 * hour per server IP); public profiles and repositories need none. A token
 * GitHub rejects (expired, revoked, mistyped) used to fail every customer's
 * GitHub section with a 401. Now the request is retried without it, the
 * token is set aside until the server restarts, and the log says so once.
 */
export function createGithubFetch(
  getToken: () => string | undefined,
  fetchImpl: typeof fetch = fetch,
  warn: (message: string) => void = (message) => log.warn(message),
): (url: string, init: { headers: Record<string, string>; signal?: AbortSignal }) => Promise<Response> {
  let tokenRejected = false;

  return async (url, init) => {
    const token = tokenRejected ? undefined : getToken();
    const withToken = token ? { ...init.headers, Authorization: `Bearer ${token}` } : init.headers;
    const response = await fetchImpl(url, { ...init, headers: withToken });
    if (response.status !== 401 || !token) return response;

    if (!tokenRejected) {
      tokenRejected = true;
      warn(
        'GitHub: GITHUB_API_TOKEN was rejected (401 Bad credentials). Continuing without it, at GitHub\'s limit of 60 requests an hour per server IP; replace the token to restore 5,000.',
      );
    }
    return fetchImpl(url, { ...init, headers: init.headers });
  };
}
