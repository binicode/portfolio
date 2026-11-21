import type { NextConfig } from 'next';
import { securityHeaderRules } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  // React <ViewTransition> on route changes needs no flag since Next 16.3
  // (native View Transitions API, no added JavaScript library).
  experimental: {
    // Not enabled: experimental.inlineCss. Measured on Next 16.2 it embedded
    // the stylesheet roughly three times per page (the <style> tag plus the
    // RSC payload), growing the home HTML from ~12 KB to ~42 KB gzipped —
    // more than the one stylesheet request it saves.
  },
  poweredByHeader: false,
  // Hardening headers and the CSP (src/lib/security-headers.ts) on every
  // page in production builds. `next dev` needs eval, so it is left alone.
  async headers() {
    if (process.env.NODE_ENV !== 'production') return [];
    return securityHeaderRules({
      apiUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
      shopDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? '',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '',
    });
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/s/files/**',
      },
    ],
  },
};

export default nextConfig;
