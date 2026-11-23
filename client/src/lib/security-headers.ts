/**
 * Response headers for every page (next.config.ts). Plain TypeScript with
 * no imports, so next.config.ts can load it and it is tested on its own
 * (security-headers.test.ts).
 *
 * The CSP has no nonces on purpose: a nonce needs a fresh one per response,
 * which would render every page on demand and give up static and ISR
 * pages. So scripts and styles keep 'unsafe-inline' (Next's inline
 * bootstrap and the style attributes), and the policy's value is in what
 * it closes: every other origin for scripts, connections only to this
 * site and the API, images only from here, no plugins, no framing, no
 * <base> or form hijacking.
 */

export interface SecurityHeaderOptions {
  /** NEXT_PUBLIC_API_URL: the browser calls the API (chat, sign-in, dashboards). */
  apiUrl: string;
  /** NEXT_PUBLIC_SITE_URL: HSTS only when the site is served over HTTPS. */
  siteUrl: string;
}

const origin = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

export function contentSecurityPolicy({ apiUrl }: Pick<SecurityHeaderOptions, 'apiUrl'>): string {
  const connect = ["'self'", origin(apiUrl)].filter(Boolean).join(' ');
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src ${connect}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

type Header = { key: string; value: string };

/** For every response, static files included. */
export function everyResponseHeaders({ siteUrl }: Pick<SecurityHeaderOptions, 'siteUrl'>): Header[] {
  const headers = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
  if (siteUrl.startsWith('https://')) {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
  }
  return headers;
}

/**
 * For pages only. A policy on a script, style or image file does nothing,
 * and sending it there added about 0.5 KB to every static response.
 */
export function documentHeaders(options: SecurityHeaderOptions): Header[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ];
}

/** Paths that are never documents: Next's hashed static files and optimised images. */
export const DOCUMENT_SOURCE = '/((?!_next/static|_next/image).*)';

/** The headers() entries for next.config.ts. */
export function securityHeaderRules(options: SecurityHeaderOptions): { source: string; headers: Header[] }[] {
  return [
    { source: '/:path*', headers: everyResponseHeaders(options) },
    { source: DOCUMENT_SOURCE, headers: documentHeaders(options) },
  ];
}
