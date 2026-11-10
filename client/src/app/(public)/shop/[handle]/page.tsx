import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ShopifyImage from '@/components/shop/ShopifyImage';
import Link from 'next/link';
import { preconnect } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { getProductByHandle, getProducts } from '@/lib/shopify-products';
import { formatPrice } from '@/lib/format';
import BuyNowButton from './buy-now-button';
import JsonLdScript from '@/components/site/JsonLd';

export const revalidate = 300;

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts().catch(() => []);
  return products.map((product) => ({ handle: product.handle }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return {};

  const path = `/shop/${product.handle}`;
  return {
    title: product.title,
    description: product.description.slice(0, 160) || `${product.title}, available in the shop.`,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: product.title,
      images: product.featuredImage ? [{ url: product.featuredImage.url, alt: product.featuredImage.altText ?? '' }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  // Product images are served by Shopify's CDN (see ShopifyImage); open that
  // connection while the HTML is still parsing.
  preconnect('https://cdn.shopify.com');

  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const defaultVariant = product.variants.find((v) => v.availableForSale) ?? product.variants[0];
  const price = formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    ...(product.featuredImage ? { image: product.featuredImage.url } : {}),
    offers: {
      '@type': 'Offer',
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: defaultVariant?.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="container-page pb-section pt-[clamp(2rem,5vw,4.5rem)]">
      <JsonLdScript data={productSchema} />

      <Link
        href="/shop"
        className="group inline-flex items-center gap-2 text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
          strokeWidth={1.75}
        />
        All products
      </Link>

      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-8">
        <div className="relative aspect-square overflow-hidden rounded-md bg-muted lg:col-span-7">
          {product.featuredImage && (
            <ShopifyImage
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(min-width: 1344px) 760px, (min-width: 1024px) 56vw, 100vw"
              loading="eager"
              fetchPriority="high"
              className="object-cover"
            />
          )}
        </div>

        <div className="lg:col-span-4 lg:col-start-9">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <h1 className="font-wide text-h2 font-semibold">{product.title}</h1>
            <p className="mt-4 font-semiwide text-h3 tabular-nums">{price}</p>

            <div className="mt-8 border-t border-border pt-8">
              {defaultVariant ? (
                <BuyNowButton variantId={defaultVariant.id} available={defaultVariant.availableForSale} />
              ) : (
                <p className="text-muted-foreground">Currently unavailable.</p>
              )}
            </div>

            {product.description && (
              <p className="mt-8 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
