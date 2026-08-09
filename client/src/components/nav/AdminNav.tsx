'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { adminLogout } from '@/lib/admin-client';
import Badge from '@/components/ui/Badge';

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
    <nav className="mt-6 flex flex-col gap-4">
      <div>
        <Badge variant="primary">Admin</Badge>
        <p className="mt-2 truncate text-xs text-muted" title={email}>
          {email}
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <Link
          href="/dashboard"
          className={
            isActive ? 'font-bold text-primary' : 'text-muted transition-colors duration-200 hover:text-foreground'
          }
        >
          Projects
        </Link>
      </div>

      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="mt-auto text-left text-sm text-muted transition-colors duration-200 hover:text-foreground disabled:opacity-40"
      >
        {isLoggingOut ? 'Logging out…' : 'Log out'}
      </button>
    </nav>
  );
}
