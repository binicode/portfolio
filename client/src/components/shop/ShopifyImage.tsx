'use client';

import Image, { type ImageLoaderProps, type ImageProps } from 'next/image';

/**
 * Shopify's CDN resizes on request (`width`) and negotiates WebP/AVIF from
 * the Accept header, so product images skip the Next.js optimizer: no
 * server-side fetch, no extra hop, served from Shopify's edge.
 * The loader lives in this client module because functions cannot be passed
 * from Server Components to next/image.
 */
function shopifyLoader({ src, width }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set('width', String(width));
  return url.toString();
}

export default function ShopifyImage(props: Omit<ImageProps, 'loader'>) {
  const { alt, ...rest } = props;
  return <Image loader={shopifyLoader} alt={alt} {...rest} />;
}
