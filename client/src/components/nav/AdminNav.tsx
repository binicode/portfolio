'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/admin-client';

interface AdminNavProps {
  email: string;
  /** New planner inquiries, shown beside the link. */
  unreadInquiries?: number;
}

const LINKS = [
  { href: '/dashboard', label: 'Projects', match: (path: string) => path === '/dashboard' || path.startsWith('/dashboard/projects') },
  { href: '/dashboard/inquiries', label: 'Inquiries', match: (path: string) => path.startsWith('/dashboard/inquiries') },
] as const;

export default function AdminNav({ email, unreadInquiries = 0 }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await adminLogout();
    } finally {
      // Redirect happens even if the logout call itself fails — a
      // failed network request shouldn't trap someone in a "logged
      // in but can't tell" state. router.refresh() busts the Router
      // Cache so a later /dashboard visit can't show a stale
      // authenticated view.
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <nav aria-label="Admin" className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-8 md:flex-col md:items-stretch">
      {LINKS.map((link) => {
        const isActive = link.match(pathname);
        const count = link.href === '/dashboard/inquiries' ? unreadInquiries : 0;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`label flex items-center gap-2 rounded-xs px-3 py-2.5 transition-colors ${
              isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 bg-signal" />}
            {link.label}
            {count > 0 && (
              /* A count is information: signal colour, not the action colour. */
              <span className="ml-auto min-w-5 rounded-xs bg-signal px-1.5 text-center tabular-nums text-signal-foreground">
                {count}
                <span className="sr-only"> new</span>
              </span>
            )}
          </Link>
        );
      })}
      <Link href="/" className="label px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
        View site
      </Link>

      <div className="md:mt-8 md:border-t md:border-border md:pt-6">
        <p className="truncate px-3 text-xs text-muted-foreground" title={email}>
          {email}
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="label mt-2 px-3 py-2 text-left text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </nav>
  );
}
