import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { getSaasMe } from '@/lib/saas-server';

async function isSaasSessionValid(): Promise<boolean> {
  try {
    await getSaasMe();
    return true;
  } catch {
    return false;
  }
}

export default async function SaasDashboardLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = await isSaasSessionValid();

  if (!isAuthenticated) {
    redirect('/saas/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/saas/dashboard" className="font-semibold">
            Creator Dashboard
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
