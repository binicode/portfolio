import { serverApiClient } from './server-api-client';
import type { Project } from '@/types/project';

export function listAllProjects(): Promise<Project[]> {
  return serverApiClient.get<Project[]>('/admin/projects');
}

export function getProjectById(id: string): Promise<Project> {
  return serverApiClient.get<Project>(`/admin/projects/${id}`);
}
