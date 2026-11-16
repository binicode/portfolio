import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { serverApiClient } from './server-api-client';
import type { SaasMeResponse, AggregatorStats } from '@/types/saas';

/**
 * The signed-in customer, or null when the session is missing, expired or
 * can't be checked. React `cache` shares one /saas/auth/me call between the
 * dashboard layout and its pages within a render.
 */
export const getSaasSession = cache(async (): Promise<SaasMeResponse | null> => {
  try {
    return await serverApiClient.get<SaasMeResponse>('/saas/auth/me');
  } catch {
    return null;
  }
});

/**
 * The signed-in customer, or a redirect to log in. Called by the dashboard
 * layout and by every page and data function under it: a layout's redirect
 * doesn't stop its pages from rendering (they render in parallel), so a page
 * fetching without this check sent a signed-out visitor's request to the API
 * and logged the 401 as a server error.
 */
export async function requireSaasSession(): Promise<SaasMeResponse> {
  const session = await getSaasSession();
  if (!session) redirect('/saas/login');
  return session;
}

export async function getAggregatorStats(): Promise<AggregatorStats> {
  await requireSaasSession();
  return serverApiClient.get<AggregatorStats>('/saas/aggregator');
}
