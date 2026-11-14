'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface DashboardNavItem {
  href: string;
  label: string;
  /** Rendered on the server and passed in, so icons add no client JavaScript. */
  icon?: ReactNode;
}

/**
 * The dashboard's page links with the current page marked (`aria-current`).
 * `sidebar`: stacked rows with icons (desktop). `bar`: inline labels (phones).
 */
export default function DashboardNavLinks({ items, variant }: { items: DashboardNavItem[]; variant: 'sidebar' | 'bar' }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard">
      <ul className={variant === 'sidebar' ? 'grid gap-1' : 'flex gap-5'}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={
                  variant === 'sidebar'
                    ? `side-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm ${
                        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                      }`
                    : `label relative inline-block py-2 transition-colors duration-150 ${
                        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`
                }
              >
                {variant === 'sidebar' && item.icon && (
                  <span aria-hidden="true" className={active ? 'text-accent-bright' : ''}>
                    {item.icon}
                  </span>
                )}
                {item.label}
                {variant === 'bar' && active && <span aria-hidden="true" className="absolute inset-x-0 bottom-0.5 h-px bg-accent" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
