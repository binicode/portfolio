import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/admin-session';
import AdminNav from '@/components/nav/AdminNav';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Admin' },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // The pages' data functions check the session too: this redirect alone
  // doesn't stop them from rendering (lib/admin-session.ts).
  const session = await requireAdminSession();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      {/* The rail is the teal body; the work area is the sand field. */}
      <aside className="theme-deep border-b border-border p-5 md:w-60 md:shrink-0 md:border-b-0 md:border-r md:p-6">
        <p className="text-body-sm font-semibold">Portfolio admin</p>
        <AdminNav email={session.email} />
      </aside>
      <main id="main" className="theme-sand flex-1 px-[var(--gutter)] py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
