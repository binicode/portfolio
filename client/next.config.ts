import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // React <ViewTransition> on route changes (native View Transitions API,
    // no added JavaScript library). Browsers without support navigate normally.
    viewTransition: true,
    // Not enabled: experimental.inlineCss. Measured on Next 16.2 it embedded
    // the stylesheet roughly three times per page (the <style> tag plus the
    // RSC payload), growing the home HTML from ~12 KB to ~42 KB gzipped —
    // more than the one stylesheet request it saves.
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
