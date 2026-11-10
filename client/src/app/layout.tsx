import type { Metadata, Viewport } from 'next';
import { Newsreader } from 'next/font/google';
import localFont from 'next/font/local';
import { clientEnv } from '@/lib/config';
import { site } from '@/lib/site';
import './globals.css';

// One variable family for the whole interface. The width axis (wdth) is
// what gives headlines their engineered, expanded character; body text
// stays at normal width.
//
// Self-hosted subset of Archivo (OFL, see fonts/OFL-Archivo.txt): Google's
// latin range, weight 400–600 and width 100–118% only — the values the design
// uses. 38 KB instead of 88 KB for the full Google file. Regenerate with
// `npm run fonts:archivo` (scripts/subset-archivo.mjs) if those ranges change.
const archivo = localFont({
  src: './fonts/archivo-latin-wght400-600-wdth100-118.woff2',
  variable: '--font-archivo',
  weight: '400 600',
  declarations: [{ prop: 'font-stretch', value: '100% 118%' }],
  display: 'swap',
  adjustFontFallback: 'Arial',
});

// Long-form serif for case studies. Declared here so its @font-face joins the
// single global stylesheet (a route-level declaration added a second
// render-blocking CSS file). Not preloaded: browsers only download a face that
// rendered text actually uses, so only case-study pages fetch it.
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
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
  themeColor: '#ecedea',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
