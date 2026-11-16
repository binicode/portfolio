import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { serverApiClient } from './server-api-client';

export interface AdminSession {
  email: string;
}

/**
 * The signed-in admin, or null when the session is missing, expired or can't
 * be checked. React `cache` shares one /admin/auth/me call between the
 * dashboard layout and its pages within a render.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  try {
    return await serverApiClient.get<AdminSession>('/admin/auth/me');
  } catch {
    return null;
  }
});

/**
 * The signed-in admin, or a redirect to sign in. Called by the dashboard
 * layout and by the admin data functions: a layout's redirect doesn't stop
 * its pages from rendering (they render in parallel), so a page fetching
 * without this check sent a signed-out visitor's request to the API and
 * logged the 401 as a server error.
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/login');
  return session;
}
