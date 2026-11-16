import type { APIRequestContext } from '@playwright/test';
import { QA } from '../settings';

/**
 * True when the API has a working database. /api/projects is a public read
 * that goes straight to MongoDB: 200 with a database, 500 without one.
 */
export async function apiHasDatabase(request: APIRequestContext): Promise<boolean> {
  const response = await request.get(`${QA.apiURL}/projects`, { timeout: 20_000 }).catch(() => null);
  return response?.status() === 200;
}

/** A unique, obviously fake address for a SaaS test user. */
export function testEmail(label: string): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return `qa.${label}.${stamp}@example.com`;
}
