import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { serverApiClient } from '@/lib/server-api-client';

async function isAdminSessionValid(): Promise<boolean> {
  try {
    await serverApiClient.get('/admin/auth/me');
    return true;
  } catch {
    return false;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = await isAdminSessionValid();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-gray-50 p-4">
        <h2 className="font-semibold">Admin</h2>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          <Link href="/dashboard" className="hover:underline">
            Projects
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
