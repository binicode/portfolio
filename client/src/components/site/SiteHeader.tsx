import Link from 'next/link';
import { contactHref, site } from '@/lib/site';
import SiteNav from './SiteNav';

export default function SiteHeader() {
  return (
    <header className="site-header theme-ink sticky top-[var(--frame)] z-40 bg-background" style={{ viewTransitionName: 'site-header' }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav aria-label="Primary" className="container-page flex h-[var(--header-h)] items-center gap-6 lg:gap-8">
        <Link href="/" className="shrink-0 text-body-sm font-semibold tracking-[-0.02em]">
          {site.name}
        </Link>
        <SiteNav />
        {/* Striped scroll meter: dim stripes, uncovered in orange as the page scrolls. */}
        <span aria-hidden="true" className="stripe-meter hidden lg:block">
          <span className="stripe-meter-cover" />
        </span>
        {/* Wrapper carries the responsive visibility: .btn-bracket's own display
            would otherwise win over the layered `hidden` utility. */}
        <div className="ml-auto hidden md:block lg:ml-0">
          <a href={contactHref} target="_blank" rel="noopener noreferrer" className="btn-bracket">
            Contact
          </a>
        </div>
      </nav>
      <span aria-hidden="true" className="scroll-meter" />
    </header>
  );
}
