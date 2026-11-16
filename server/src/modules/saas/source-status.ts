import type { SourceStatus } from './saas.types.js';

/**
 * Runs one dashboard source and says how it went. Pure (no environment, no
 * providers), so it is unit-tested on its own.
 *
 * - No identifier configured: not_connected.
 * - The provider says the identifier doesn't exist (the services throw a
 *   404, e.g. no such GitHub user or YouTube channel): not_found, so the
 *   customer is told to check it rather than to retry.
 * - Any other failure (timeout, 5xx, rejected credentials): unavailable.
 */
export async function loadSource<T>(
  identifier: string | undefined,
  label: string,
  fetcher: (identifier: string) => Promise<T>,
): Promise<{ data: T | null; status: SourceStatus }> {
  if (!identifier) return { data: null, status: 'not_connected' };
  try {
    return { data: await fetcher(identifier), status: 'connected' };
  } catch (error) {
    if (isNotFound(error)) {
      console.warn(`Aggregator: ${label} identifier not found`);
      return { data: null, status: 'not_found' };
    }
    console.error(`Aggregator: ${label} fetch failed`, error);
    return { data: null, status: 'unavailable' };
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { statusCode?: unknown }).statusCode === 404;
}
