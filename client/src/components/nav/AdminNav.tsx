'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/admin-client';

interface AdminNavProps {
  email: string;
}

export default function AdminNav({ email }: AdminNavProps) {
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

  const isActive = pathname.startsWith('/dashboard');

  return (
    <nav aria-label="Admin" className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 md:mt-8 md:flex-col md:items-stretch">
      <Link
        href="/dashboard"
        aria-current={isActive ? 'page' : undefined}
        className={`label flex items-center gap-2 rounded-xs px-3 py-2.5 transition-colors ${
          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {isActive && <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent" />}
        Projects
      </Link>
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
