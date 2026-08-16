'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/', matchPrefix: '/' },
  { label: 'Projects', href: '/projects', matchPrefix: '/projects' },
  { label: 'Shop', href: '/shop', matchPrefix: '/shop' },
  { label: 'SaaS Demo', href: '/saas/signup', matchPrefix: '/saas' },
];

export function SiteNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav className="flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border bg-white/5 px-4 py-2.5 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-indigo text-sm font-bold text-primary-foreground">
            BA
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px] shadow-emerald-400/60" />
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">Biniyam Abera</span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = link.matchPrefix === '/' ? pathname === '/' : pathname.startsWith(link.matchPrefix);
            return (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/5 text-foreground'
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white/5 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="absolute left-4 right-4 top-20 rounded-2xl border border-border bg-background/90 p-3 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
