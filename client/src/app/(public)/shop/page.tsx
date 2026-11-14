import type { Metadata } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import Link from 'next/link';
import { preconnect } from 'react-dom';
import ShopifyImage from '@/components/shop/ShopifyImage';
import { getProducts } from '@/lib/shopify-products';
import { formatPrice } from '@/lib/format';

// Shopify is queried with POST, which the fetch cache doesn't store, so the
// page itself is regenerated in the background at most every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'A headless storefront built on the Shopify Storefront API and rendered on the server with Next.js. Checkout is handled by Shopify.',
  alternates: { canonical: '/shop' },
  openGraph: { url: '/shop' },
};

/**
 * During `next build`, a Shopify failure (an outage, or a CI build without
 * store credentials) renders the empty state instead of failing the whole
 * build; ISR replaces it within `revalidate`. At runtime the error is
 * rethrown, so a failed regeneration keeps serving the last good page and a
 * cold miss shows the route's error boundary.
 */
async function loadProducts() {
  try {
    return await getProducts();
  } catch (error) {
    if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
      console.warn('Shop: products unavailable at build time; serving the empty state until revalidation.', error);
      return [];
    }
    throw error;
  }
}

export default async function ShopPage() {
  // Product images are served by Shopify's CDN (see ShopifyImage); open that
  // connection while the HTML is still parsing.
  preconnect('https://cdn.shopify.com');

  const products = await loadProducts();

  return (
    <div className="container-page pb-section pt-[clamp(3rem,7vw,6.5rem)]">
      <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <h1 className="text-h1 font-medium lg:col-span-7">Shop</h1>
        <p className="max-w-[30rem] text-lead text-muted-foreground lg:col-span-5">
          Live from Shopify. Checkout by Shopify.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="mt-14 border-y border-border py-12 text-lead text-muted-foreground">
          No products right now.
        </p>
      ) : (
        <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
          {products.map((product, index) => (
            <li key={product.id}>
              <Link href={`/shop/${product.handle}`} className="group block">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  {!product.featuredImage && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-center p-8 text-center text-h3 font-semibold text-muted-foreground"
                    >
                      {product.title}
                    </span>
                  )}
                  {product.featuredImage && (
                    <ShopifyImage
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText ?? product.title}
                      fill
                      sizes="(min-width: 1344px) 432px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
                      // Only the first card is the LCP candidate (one column on phones);
                      // giving three images high priority made them compete for bandwidth.
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      className="object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-border pt-3">
                  <h2 className="font-medium">{product.title}</h2>
                  <p className="shrink-0 tabular-nums text-muted-foreground">
                    {formatPrice(
                      product.priceRange.minVariantPrice.amount,
                      product.priceRange.minVariantPrice.currencyCode,
                    )}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
