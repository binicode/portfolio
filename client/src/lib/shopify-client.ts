import { createStorefrontApiClient } from '@shopify/storefront-api-client';
import { clientEnv } from './config';

// Pinned explicitly — see rationale in chat. Bump deliberately when
// moving to a newer Storefront API version, don't leave this unpinned.
const STOREFRONT_API_VERSION = '2026-07';

// A slow Storefront API must not hold a page regeneration or a Buy now click
// open indefinitely. Catalogue reads normally answer in well under a second.
const SHOPIFY_TIMEOUT_MS = 8_000;

export const shopifyClient = createStorefrontApiClient({
  storeDomain: clientEnv.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  apiVersion: STOREFRONT_API_VERSION,
  publicAccessToken: clientEnv.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  customFetchApi: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(SHOPIFY_TIMEOUT_MS) }),
});
