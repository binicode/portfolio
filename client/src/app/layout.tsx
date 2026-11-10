import type { Metadata, Viewport } from 'next';
import { Archivo, Newsreader } from 'next/font/google';
import { clientEnv } from '@/lib/config';
import { site } from '@/lib/site';
import './globals.css';

// One variable family for the whole interface. The width axis (wdth) is
// what gives headlines their engineered, expanded character; body text
// stays at normal width.
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
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
