import Link from 'next/link';
import Image from 'next/image';
import { getProducts } from '@/lib/shopify-products';
import Card from '@/components/ui/Card';

function formatPrice(amount: string, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight text-foreground">Shop</h1>

      {products.length === 0 ? (
        <p className="mt-6 text-muted">No products available yet.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/${product.handle}`}>
              <Card noPadding className="overflow-hidden">
                {product.featuredImage && (
                  <div className="relative aspect-square bg-surface">
                    <Image
                      src={product.featuredImage.url}
                      alt={product.featuredImage.altText ?? product.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-sm font-bold text-foreground">{product.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(
                      product.priceRange.minVariantPrice.amount,
                      product.priceRange.minVariantPrice.currencyCode,
                    )}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
