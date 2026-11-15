import Link from 'next/link';
import { site } from '@/lib/site';
import OpenChatButton from '@/components/chat/OpenChatButton';
import PillParts, { pillClasses } from '@/components/ui/PillAction';
import SiteNav from './SiteNav';

/**
 * Minimal, as on the reference board: the name at the top left, a few
 * words of navigation and one pill on the right. It scrolls away with the
 * page. No colour of its own: it takes the page's material (the canvas on
 * portfolio pages, ink on the products).
 */
export default function SiteHeader() {
  return (
    <header className="relative z-40" style={{ viewTransitionName: 'site-header' }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav aria-label="Primary" className="container-page flex h-[var(--site-header-h)] items-center gap-6 lg:gap-10">
        <Link href="/" className="shrink-0 text-[1.0625rem] font-semibold tracking-[-0.02em] sm:text-lg">
          {site.name}
        </Link>
        <SiteNav />
        {/* The one call to action on every page: plan a project with the assistant. */}
        <div className="hidden md:block">
          <OpenChatButton mode="discovery" className={pillClasses()}>
            <PillParts size="sm" arrow={false}>
              Start a project
            </PillParts>
          </OpenChatButton>
        </div>
      </nav>
    </header>
  );
}
