import type { ShopifyProduct } from '@/types/shopify';

/**
 * What a product card says about price and stock, from data the storefront
 * query already returns (variants with price and availability). Pure, so
 * the shop renders on the server and this runs under `node --test`.
 */

/** "From" when the variants don't all cost the same. */
export function hasPriceRange(product: Pick<ShopifyProduct, 'variants'>): boolean {
  const amounts = new Set(product.variants.map((variant) => Number(variant.price.amount)));
  return amounts.size > 1;
}

/** Sold out only when there are variants and none can be bought. */
export function isSoldOut(product: Pick<ShopifyProduct, 'variants'>): boolean {
  return product.variants.length > 0 && product.variants.every((variant) => !variant.availableForSale);
}

/** The currency the prices are shown in, when every product agrees on one. */
export function sharedCurrency(products: Array<Pick<ShopifyProduct, 'priceRange'>>): string | null {
  const codes = new Set(products.map((product) => product.priceRange.minVariantPrice.currencyCode));
  return codes.size === 1 ? [...codes][0] : null;
}
