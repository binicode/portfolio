import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSaasMe } from '@/lib/saas-server';
import SaasNav from '@/components/nav/SaasNav';
import type { SaasMeResponse } from '@/types/saas';

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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/saas/dashboard" className="font-bold text-foreground">
            Creator Dashboard
          </Link>
          <SaasNav email={session.email} subscriptionStatus={session.subscriptionStatus} />
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
