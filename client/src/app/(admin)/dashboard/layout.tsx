import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { clientEnv } from '@/lib/config';

/**
 * Verifies the admin session by forwarding the incoming request's
 * cookies to the backend's GET /admin/auth/me route. Deliberately
 * does NOT use apiClient — that wrapper relies on the browser's cookie
 * jar via credentials: 'include', which does nothing here since this
 * fetch is server-to-server, not browser-to-server. cache: 'no-store'
 * is required — caching this would risk serving a cached "authenticated"
 * result to a different, unauthenticated visitor.
 */
async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();

  const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/admin/auth/me`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: 'no-store',
  });

  return response.ok;
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = await verifyAdminSession();

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
