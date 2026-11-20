import { serverApiClient } from './server-api-client';
import { requireAdminSession } from './admin-session';
import type { InquiryList, InquiryStats } from '@/types/inquiry';

// Each call checks the admin session first (redirecting when signed out), so
// no page can send the API a signed-out request (see admin-session.ts).

export async function listInquiries(): Promise<InquiryList> {
  await requireAdminSession();
  return serverApiClient.get<InquiryList>('/admin/inquiries');
}

export async function getInquiryStats(): Promise<InquiryStats> {
  await requireAdminSession();
  return serverApiClient.get<InquiryStats>('/admin/inquiries/stats');
}
