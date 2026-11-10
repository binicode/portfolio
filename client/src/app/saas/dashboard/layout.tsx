import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSaasMe } from '@/lib/saas-server';
import SaasNav from '@/components/nav/SaasNav';
import type { SaasMeResponse } from '@/types/saas';

export const metadata: Metadata = {
  title: 'Creator Dashboard',
  robots: { index: false, follow: false },
};

async function getSaasSession(): Promise<SaasMeResponse | null> {
  try {
    return await getSaasMe();
  } catch {
    return null;
  }
}

export default async function SaasDashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSaasSession();

  if (!session) {
    redirect('/saas/login');
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="container-page flex min-h-[var(--header-h)] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
          <Link href="/saas/dashboard" className="font-semiwide text-[0.9375rem] font-semibold tracking-tight">
            Creator Dashboard
          </Link>
          <SaasNav email={session.email} subscriptionStatus={session.subscriptionStatus} />
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
