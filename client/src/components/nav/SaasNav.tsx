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
    <div className="flex items-center gap-6">
      <nav className="flex gap-6 text-sm">
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive ? 'font-bold text-primary' : 'text-muted transition-colors duration-200 hover:text-foreground'
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <Badge variant={subscriptionStatus === 'active' ? 'success' : 'muted'}>
          {subscriptionStatus === 'active' ? 'Pro' : 'Free'}
        </Badge>
        <span className="truncate text-xs text-muted" title={email}>
          {email}
        </span>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-sm text-muted transition-colors duration-200 hover:text-foreground disabled:opacity-40"
        >
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </div>
  );
}
