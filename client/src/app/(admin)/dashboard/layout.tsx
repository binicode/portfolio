import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { serverApiClient } from '@/lib/server-api-client';
import AdminNav from '@/components/nav/AdminNav';

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
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-white/10 bg-surface p-4">
        <h2 className="font-bold text-foreground">Admin</h2>
        <AdminNav email={session.email} />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
