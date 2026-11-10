import Link from 'next/link';
import { site } from '@/lib/site';
import SiteNav from './SiteNav';

export default function SiteHeader() {
  return (
    <header
      className="site-header sticky top-0 z-40 bg-background"
      style={{ viewTransitionName: 'site-header' }}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav aria-label="Primary" className="container-page flex h-[var(--header-h)] items-center justify-between gap-6">
        <Link href="/" className="font-semiwide text-[0.9375rem] font-semibold tracking-tight">
          {site.name}
        </Link>
        <SiteNav />
      </nav>
    </header>
  );
}
