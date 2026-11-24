/**
 * How long the site's server waits for the API before giving up, so a
 * stalled request can't hold a page render open. Long enough for the API to
 * wake: Koyeb's free instance sleeps after an hour without traffic and takes
 * a few seconds to answer the first request (docs/deploy.md).
 */
export const SERVER_FETCH_TIMEOUT_MS = 10_000;

/**
 * `init` with a timeout signal, unless the caller set a signal of its own.
 * (In Next.js a signal only opts the request out of per-render memoization;
 * `next.revalidate` caching still applies.)
 */
export function withTimeout<T extends RequestInit>(init: T = {} as T, ms = SERVER_FETCH_TIMEOUT_MS): T {
  return init.signal ? init : { ...init, signal: AbortSignal.timeout(ms) };
}
