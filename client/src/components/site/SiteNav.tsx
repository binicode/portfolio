'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { primaryNav, contactHref } from '@/lib/site';
import { requestOpenChat } from '@/components/chat/chat-events';
import { buttonClasses } from '@/components/ui/button-styles';

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
      <ul className="hidden items-center gap-5 md:flex">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`label relative py-2 transition-colors duration-150 ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
                {active && (
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0.5 h-px bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        popoverTarget="site-menu"
        className="label ml-auto inline-flex h-9 items-center border border-border px-3 text-foreground md:hidden"
      >
        Menu
      </button>

      <div
        ref={menuRef}
        id="site-menu"
        popover="auto"
        aria-label="Site menu"
        className="site-menu m-0 w-auto max-w-none border-0 border-b border-border bg-background p-0 text-foreground md:hidden"
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
                    {active && <span className="label text-accent">Current</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 grid gap-3">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => {
                closeMenu();
                requestOpenChat('discovery');
              }}
              className={buttonClasses('accent', 'lg', 'w-full')}
            >
              Start a project
            </button>
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={buttonClasses('secondary', 'lg', 'w-full')}
            >
              Message me on LinkedIn
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <p className="mt-3 text-body-sm text-muted-foreground">Starting takes about 2 minutes and ends with a project brief.</p>
        </div>
      </div>
    </>
  );
}
