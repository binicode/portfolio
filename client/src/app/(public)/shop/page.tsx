import type { Metadata } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { preconnect } from 'react-dom';
import ProductCard from '@/components/shop/ProductCard';
import OpenChatButton from '@/components/chat/OpenChatButton';
import { buttonClasses } from '@/components/ui/button-styles';
import { getProducts } from '@/lib/shopify-products';
import { sharedCurrency } from '@/lib/shop-display';

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
  const currency = sharedCurrency(products);

  return (
    <div className="container-page pb-section pt-[clamp(2.5rem,5vw,4.5rem)]">
      <header className="grid gap-4 lg:grid-cols-12 lg:items-end lg:gap-8">
        <h1 className="text-h1 font-medium lg:col-span-7">Shop</h1>
        <p className="max-w-[30rem] text-lead text-muted-foreground lg:col-span-5">
          A demo storefront. Live Shopify catalogue and checkout.
        </p>
      </header>

      {products.length === 0 ? (
        <p className="mt-10 border-y border-border py-12 text-lead text-muted-foreground">
          No products right now.
        </p>
      ) : (
        <>
          {/* The grid's own toolbar: what's here, and in which currency. */}
          <div className="mt-8 flex items-baseline justify-between gap-4 border-t border-border pt-4 lg:mt-12">
            <p className="label text-muted-foreground">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
            {currency && <p className="label text-muted-foreground">Prices in {currency}</p>}
          </div>
          {/* Compact on purpose: 2 columns on phones up to 5 on wide screens,
              so the photos stay objects in a catalogue, not walls of white. */}
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product, index) => (
              <li key={product.id}>
                {/* Only the first photo is an LCP candidate; more high-priority
                    images would compete for bandwidth. */}
                <ProductCard product={product} priority={index === 0} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* The store is a working demo; a visitor here may want one of their own. */}
      <section
        aria-labelledby="store-cta-title"
        className="mt-16 flex flex-col gap-6 border-y border-border py-10 lg:mt-24 lg:flex-row lg:items-center lg:justify-between lg:py-12"
      >
        <div>
          <h2 id="store-cta-title" className="text-title font-medium">
            Want a store like this?
          </h2>
          <p className="mt-2 text-muted-foreground">Your design, Shopify’s catalogue and checkout.</p>
        </div>
        <OpenChatButton mode="discovery" build="ecommerce" className={buttonClasses('accent')}>
          Plan a similar store
        </OpenChatButton>
      </section>
    </div>
  );
}
