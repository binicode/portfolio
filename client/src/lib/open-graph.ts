import type { Metadata } from 'next';
import { site } from './site';

type OpenGraph = NonNullable<Metadata['openGraph']>;

/** The alt text of the site's shared preview image (app/opengraph-image.tsx). */
export const OG_IMAGE_ALT = 'Biniyam Abera, freelance full-stack engineer. Your product, built to hold up.';

/** The site's shared preview image, generated at build time by app/opengraph-image.tsx. */
export const OG_IMAGE = { url: '/opengraph-image', width: 1200, height: 630, alt: OG_IMAGE_ALT, type: 'image/png' };

/**
 * A page's Open Graph fields on top of the ones every page shares: the site
 * name, type, locale and preview image. Next.js merges metadata shallowly,
 * so a page that sets `openGraph` (for its own og:url) replaces the
 * layout's whole object; without this, link previews of those pages lost
 * the image and the site name.
 */
export function pageOpenGraph(fields: OpenGraph): OpenGraph {
  return { type: 'website', siteName: site.name, locale: 'en_US', images: [OG_IMAGE], ...fields } as OpenGraph;
}
