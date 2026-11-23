/**
 * Whether search engines may index the site. Off unless SITE_INDEXING=on,
 * which is set at launch: until then, and in any deployment that leaves the
 * setting out, the site stays out of search results. Server-side only, read
 * when robots.txt and the root layout are built.
 */
export const indexingAllowed = process.env.SITE_INDEXING === 'on';
