'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { primaryNav, contactHref } from '@/lib/site';

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
      <ul className="hidden items-center gap-1 md:flex">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[0.9375rem] transition-colors duration-150 ${
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
                {active && (
                  <span aria-hidden="true" className="absolute inset-x-3.5 -bottom-px h-px bg-foreground" />
                )}
              </Link>
            </li>
          );
        })}
        <li className="ml-3">
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-full border border-foreground/25 px-4 text-sm font-medium transition-colors duration-150 hover:border-foreground"
          >
            Contact
          </a>
        </li>
      </ul>

      <button
        type="button"
        popoverTarget="site-menu"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-foreground/25 px-4 text-sm font-medium md:hidden"
      >
        Menu
      </button>

      <div
        ref={menuRef}
        id="site-menu"
        popover="auto"
        aria-label="Site menu"
        className="site-menu m-0 w-full max-w-none border-0 border-b border-border bg-background p-0 text-foreground md:hidden"
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
                    className="flex items-center justify-between py-4 font-semiwide text-2xl font-medium tracking-tight"
                  >
                    {item.label}
                    {active && <span className="text-sm font-normal text-muted-foreground">Current page</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          <a
            href={contactHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-5 text-[0.9375rem] font-medium text-primary-foreground"
          >
            Contact on LinkedIn
          </a>
        </div>
      </div>
    </>
  );
}
