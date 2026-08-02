import Link from 'next/link';
import Image from 'next/image';
import { getProducts } from '@/lib/shopify-products';

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
      <h1 className="text-3xl font-bold tracking-tight">Shop</h1>

      {products.length === 0 ? (
        <p className="mt-6 text-gray-600">No products available yet.</p>
      ) : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/${product.handle}`} className="group">
              {product.featuredImage && (
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText ?? product.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition group-hover:scale-105"
                    unoptimized
                  />
                </div>
              )}
              <h2 className="mt-3 text-sm font-medium">{product.title}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {formatPrice(
                  product.priceRange.minVariantPrice.amount,
                  product.priceRange.minVariantPrice.currencyCode,
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
