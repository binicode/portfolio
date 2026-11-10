/**
 * Public environment configuration.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so they are read with
 * literal `process.env.X` expressions (dynamic access is not inlined).
 * Validation is a few lines of plain code rather than a schema library:
 * this module is imported by browser code (the chat widget), and a
 * validation library here previously shipped ~64 KB of JavaScript to
 * every public page.
 */

function requireUrl(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} — check client/.env.local`);
  }
  try {
    new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute URL — check client/.env.local`);
  }
  return value;
}

function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name} — check client/.env.local`);
  }
  return value;
}

export const clientEnv = {
  NEXT_PUBLIC_API_URL: requireUrl('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL),
  NEXT_PUBLIC_SITE_URL: requireUrl('NEXT_PUBLIC_SITE_URL', process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: requireValue(
    'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN',
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  ),
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: requireValue(
    'NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN',
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  ),
} as const;
