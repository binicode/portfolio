'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { logoutSaasUser } from '@/lib/saas-client';

/**
 * Ends the dashboard session and returns to sign-in. The session cookie is
 * cleared by the API; a failed request still navigates away, and the
 * dashboard's server-side session check keeps the account protected.
 */
export default function LogoutButton({ className = '', children }: { className?: string; children?: ReactNode }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await logoutSaasUser();
    } finally {
      router.push('/saas/login');
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={logout} disabled={pending} className={className}>
      {children ?? (pending ? 'Logging out…' : 'Log out')}
    </button>
  );
}
