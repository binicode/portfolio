import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { serverApiClient } from '@/lib/server-api-client';
import AdminNav from '@/components/nav/AdminNav';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin' },
  robots: { index: false, follow: false },
};

interface AdminMeResponse {
  email: string;
}

async function getAdminSession(): Promise<AdminMeResponse | null> {
  try {
    return await serverApiClient.get<AdminMeResponse>('/admin/auth/me');
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-border bg-card p-5 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-6">
        <p className="font-semiwide text-[0.9375rem] font-semibold">Portfolio admin</p>
        <AdminNav email={session.email} />
      </aside>
      <main id="main" className="flex-1 px-[var(--gutter)] py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
