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
 * site, the API and the Shopify store, images only from here and Shopify's
 * CDN, no plugins, no framing, no <base> or form hijacking.
 */

export interface SecurityHeaderOptions {
  /** NEXT_PUBLIC_API_URL: the browser calls the API (chat, sign-in, dashboards). */
  apiUrl: string;
  /** NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: Buy now creates a cart from the browser. */
  shopDomain: string;
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

export function contentSecurityPolicy({ apiUrl, shopDomain }: Pick<SecurityHeaderOptions, 'apiUrl' | 'shopDomain'>): string {
  const shop = origin(`https://${shopDomain}`);
  const connect = ["'self'", origin(apiUrl), shop].filter(Boolean).join(' ');
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.shopify.com",
    "font-src 'self'",
    `connect-src ${connect}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function securityHeaders(options: SecurityHeaderOptions): { key: string; value: string }[] {
  const headers = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  ];
  if (options.siteUrl.startsWith('https://')) {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
  }
  return headers;
}
