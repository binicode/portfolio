import { serverApiClient } from './server-api-client';
import type { SaasMeResponse, AggregatorStats } from '@/types/saas';

export function getSaasMe(): Promise<SaasMeResponse> {
  return serverApiClient.get<SaasMeResponse>('/saas/auth/me');
}

export function getAggregatorStats(): Promise<AggregatorStats> {
  return serverApiClient.get<AggregatorStats>('/saas/aggregator');
}
