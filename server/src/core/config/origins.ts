/**
 * The browser origins allowed to call the API with credentials (CORS).
 * CLIENT_ORIGIN is one origin or a comma-separated list, for example the
 * site and its preview domain. The first is the public site: Stripe
 * Checkout and other redirects go back to it. Pure, so it is tested
 * without the environment (origins.test.ts).
 */

export function parseClientOrigins(value: string): string[] {
  const origins = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      let url: URL;
      try {
        url = new URL(part);
      } catch {
        throw new Error(`"${part}" is not a URL`);
      }
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`"${part}" must be http or https`);
      if (url.pathname !== '/' || url.search || url.hash) throw new Error(`"${part}" must be an origin, without a path`);
      return url.origin;
    });
  if (origins.length === 0) throw new Error('at least one origin is required');
  return [...new Set(origins)];
}

export function primaryClientOrigin(value: string): string {
  return parseClientOrigins(value)[0];
}

/** The cors package's origin check: exact matches only, no wildcards. */
export function corsOriginCheck(allowed: readonly string[]) {
  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // No Origin header: same-origin, server-to-server (the Next server) or
    // a tool like curl. CORS doesn't apply; authorization still does.
    callback(null, origin === undefined || allowed.includes(origin));
  };
}
