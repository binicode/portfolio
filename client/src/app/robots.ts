import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/config';
import { indexingAllowed } from '@/lib/indexing';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: indexingAllowed
      ? [{ userAgent: '*', allow: '/', disallow: ['/dashboard', '/saas/dashboard'] }]
      : // Before launch: nothing is crawled (lib/indexing.ts).
        [{ userAgent: '*', disallow: '/' }],
    sitemap: `${clientEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
