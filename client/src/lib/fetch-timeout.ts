/**
 * How long the site's server waits for the API before giving up, so a
 * stalled request can't hold a page render open. Render's free instance,
 * which hosts the API, sleeps after 15 minutes without traffic and takes
 * about a minute to wake; a scheduled ping keeps it awake
 * (netlify/functions/keep-api-awake.mjs, docs/deploy.md), so a normal
 * answer takes well under this.
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
