import { serverApiClient } from './server-api-client';
import { requireAdminSession } from './admin-session';
import type { Project } from '@/types/project';

// Each call checks the admin session first (redirecting when signed out), so
// no page can send the API a signed-out request (see admin-session.ts).

export async function listAllProjects(): Promise<Project[]> {
  await requireAdminSession();
  return serverApiClient.get<Project[]>('/admin/projects');
}

export async function getProjectById(id: string): Promise<Project> {
  await requireAdminSession();
  return serverApiClient.get<Project>(`/admin/projects/${id}`);
}
