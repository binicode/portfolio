import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductByHandle } from '@/lib/shopify-products';
import BuyNowButton from './buy-now-button';

interface ProductPageProps {
  params: Promise<{ handle: string }>;
}

function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    notFound();
  }

  const defaultVariant = product.variants.find((v) => v.availableForSale) ?? product.variants[0];

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.priceRange.minVariantPrice.amount,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      availability: defaultVariant?.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <div className="grid gap-10 sm:grid-cols-2">
        {product.featuredImage && (
          <div className="relative aspect-square overflow-hidden rounded-[20px] bg-surface">
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div>
          <h1 className="text-4xl font-bold text-foreground">{product.title}</h1>
          <p className="mt-2 text-lg text-muted">
            {formatPrice(
              product.priceRange.minVariantPrice.amount,
              product.priceRange.minVariantPrice.currencyCode,
            )}
          </p>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">{product.description}</p>

          <div className="mt-8">
            {defaultVariant ? (
              <BuyNowButton variantId={defaultVariant.id} available={defaultVariant.availableForSale} />
            ) : (
              <p className="text-sm text-muted">Currently unavailable.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
