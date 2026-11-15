import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import ShopifyImage from '@/components/shop/ShopifyImage';
import { formatPrice } from '@/lib/format';
import { hasPriceRange, isSoldOut } from '@/lib/shop-display';
import type { ShopifyProduct } from '@/types/shopify';

// Rendered width of a card's photo at each breakpoint of the shop grid
// (2 / 3 / 4 / 5 columns, minus gaps and the card's inset), so the browser
// picks the right file from Shopify's CDN.
const SIZES = '(min-width: 1344px) 224px, (min-width: 1280px) 17vw, (min-width: 1024px) 21vw, (min-width: 640px) 29vw, 44vw';

interface ProductCardProps {
  product: ShopifyProduct;
  /** The first card is the likeliest LCP image on phones. */
  priority?: boolean;
}

/**
 * A product in the shop grid. The photo sits whole (contain, never cropped
 * or tinted) on a white plate, its own background, inset in a dark card, so
 * a bright product shot reads as a framed object rather than a block of
 * light. Title, then the price as the figure to notice (signal), with
 * "From" and "Sold out" from the variants. The whole card is one link.
 */
export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const soldOut = isSoldOut(product);
  const price = formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-2 transition-colors duration-200 hover:border-signal/45 focus-visible:border-signal/45"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        {product.featuredImage ? (
          <ShopifyImage
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            sizes={SIZES}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="object-contain p-[6%] transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.04]"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-raised text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-5" strokeWidth={1.5} />
            <span className="label">No photo</span>
          </span>
        )}
        {soldOut && (
          <span className="label absolute left-2 top-2 rounded-xs bg-background/85 px-1.5 py-0.5 text-muted-foreground">
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3">
        <h2 className="line-clamp-2 min-h-[2lh] text-sm font-medium leading-snug transition-colors duration-200 group-hover:text-signal-bright">
          {product.title}
        </h2>
        <p className={`mt-auto pt-2 text-sm tabular-nums ${soldOut ? 'text-muted-foreground' : 'text-signal'}`}>
          {hasPriceRange(product) && <span className="text-muted-foreground">From </span>}
          {price}
        </p>
      </div>
    </Link>
  );
}
