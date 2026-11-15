'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowOut } from '@/components/ui/Arrow';
import { primaryNav, contactHref } from '@/lib/site';
import { requestOpenChat } from '@/components/chat/chat-events';
import PillParts, { pillClasses } from '@/components/ui/PillAction';

function isActive(pathname: string, href: string): boolean {
  if (href.includes('#')) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The only interactive part of the header: active-link state and the
 * mobile menu. The menu uses the native Popover API, so opening,
 * light-dismiss, Escape and focus return come from the browser.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => menuRef.current?.hidePopover();

  return (
    <>
      <ul className="ml-auto hidden items-center gap-7 md:flex">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`py-2 text-body-sm font-medium underline-offset-[0.4em] transition-colors duration-150 ${
                  active ? 'text-foreground underline decoration-1' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        popoverTarget="site-menu"
        className="ml-auto inline-flex h-10 items-center rounded-full border border-foreground/20 px-5 text-sm font-medium text-foreground md:hidden"
      >
        Menu
      </button>

      <div
        ref={menuRef}
        id="site-menu"
        popover="auto"
        aria-label="Site menu"
        className="site-menu m-0 w-auto max-w-none rounded-b-2xl border-0 bg-background p-0 text-foreground md:hidden"
      >
        <div className="container-page pb-8 pt-2">
          <ul className="divide-y divide-border border-y border-border">
            {primaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    aria-current={active ? 'page' : undefined}
                    className="flex items-center justify-between py-4 text-2xl font-medium tracking-[-0.03em]"
                  >
                    {item.label}
                    {active && <span className="text-sm font-normal text-muted-foreground">You’re here</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col items-start gap-3">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                closeMenu();
                requestOpenChat('discovery');
              }}
              className={pillClasses()}
            >
              <PillParts>Start a project</PillParts>
            </button>
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="inline-flex h-12 items-center gap-1.5 text-[0.9375rem] font-medium text-foreground underline decoration-foreground/30 underline-offset-[0.35em] hover:decoration-foreground"
            >
              Message me on LinkedIn
              <ArrowOut className="h-4 w-4" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <p className="mt-2 text-body-sm text-muted-foreground">Starting takes about 2 minutes and ends with a project brief.</p>
        </div>
      </div>
    </>
  );
}
