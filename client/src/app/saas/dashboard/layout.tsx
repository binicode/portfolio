import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSaasSession } from '@/lib/saas-server';
import SaasNav from '@/components/nav/SaasNav';
import DashboardSidebar from '@/components/nav/DashboardSidebar';

export const metadata: Metadata = {
  // A plain string here would stop the root template from applying to child
  // pages, so this layout defines its own.
  title: { default: 'Creator Dashboard', template: '%s — Creator Dashboard' },
  robots: { index: false, follow: false },
};

export default async function SaasDashboardLayout({ children }: { children: ReactNode }) {
  // The pages check the session too: this redirect alone doesn't stop them
  // from rendering (lib/saas-server.ts).
  const session = await requireSaasSession();

  // Desktop: a sidebar beside the page. Below `lg` the sidebar is hidden and
  // a compact top bar carries the same pages and account.
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <DashboardSidebar session={session} />
      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="theme-deep border-b border-border lg:hidden">
          <div className="container-page flex min-h-[var(--header-h)] flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3">
            <Link href="/saas/dashboard" className="text-body-sm font-semibold tracking-tight">
              Creator Dashboard
            </Link>
            <SaasNav email={session.email} subscriptionStatus={session.subscriptionStatus} />
          </div>
        </header>
        <main id="main" className="theme-sand flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
