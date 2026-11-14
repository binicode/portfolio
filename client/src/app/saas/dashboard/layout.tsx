import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getSaasMe } from '@/lib/saas-server';
import SaasNav from '@/components/nav/SaasNav';
import DashboardSidebar from '@/components/nav/DashboardSidebar';
import type { SaasMeResponse } from '@/types/saas';

export const metadata: Metadata = {
  // A plain string here would stop the root template from applying to child
  // pages, so this layout defines its own.
  title: { default: 'Creator Dashboard', template: '%s — Creator Dashboard' },
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

  // Desktop: a sidebar beside the page. Below `lg` the sidebar is hidden and
  // a compact top bar carries the same pages and account.
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <DashboardSidebar session={session} />
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="border-b border-border lg:hidden">
          <div className="container-page flex min-h-[var(--header-h)] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
            <Link href="/saas/dashboard" className="text-body-sm font-semibold tracking-tight">
              Creator Dashboard
            </Link>
            <SaasNav email={session.email} subscriptionStatus={session.subscriptionStatus} />
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
