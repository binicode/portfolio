'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutSaasUser } from '@/lib/saas-client';
import Badge from '@/components/ui/Badge';
import type { SubscriptionStatus } from '@/types/saas';

interface SaasNavProps {
  email: string;
  subscriptionStatus: SubscriptionStatus;
}

const LINKS = [
  { href: '/saas/dashboard', label: 'Dashboard' },
  { href: '/saas/dashboard/settings', label: 'Settings' },
];

export default function SaasNav({ email, subscriptionStatus }: SaasNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logoutSaasUser();
    } finally {
      router.push('/saas/login');
      router.refresh();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <nav aria-label="Dashboard">
        <ul className="flex gap-5">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`label relative inline-block py-2 transition-colors duration-150 ${
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0.5 h-px bg-accent" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex min-w-0 items-center gap-3">
        <Badge variant={subscriptionStatus === 'active' ? 'success' : 'muted'}>
          {subscriptionStatus === 'active' ? 'Pro' : 'Free'}
        </Badge>
        <span className="max-w-[12rem] truncate text-sm text-muted-foreground" title={email}>
          {email}
        </span>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="label py-2 text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:opacity-40"
        >
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
