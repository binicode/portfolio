import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { clientEnv } from '@/lib/config';
import { site } from '@/lib/site';
import './globals.css';

// Two self-hosted subsets (OFL, licences in ./fonts), regenerated with
// `npm run fonts:subset` (scripts/subset-fonts.mjs):
// - Inter Tight: tight grotesk for headings and body. Latin, weight 400–600. ~27 KB.
// - Geist Mono: uppercase micro labels and coordinates. ASCII, weight 400–500. ~9 KB.
const sans = localFont({
  src: './fonts/inter-tight-latin-wght400-600.woff2',
  variable: '--font-sans-face',
  weight: '400 600',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

const mono = localFont({
  src: './fonts/geist-mono-ascii-wght400-500.woff2',
  variable: '--font-mono-face',
  weight: '400 500',
  display: 'swap',
  // Labels are small and below the headline; no need to compete with it.
  preload: false,
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: clientEnv.NEXT_PUBLIC_SITE_URL }],
  creator: site.name,
  // Canonical URLs and og:url are set per page; defining them here would
  // make every page without its own value point at the home page.
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: 'en_US',
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.role}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: '#0c0c0d',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
