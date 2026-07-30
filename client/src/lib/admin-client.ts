import { apiClient } from './api-client';
import type { Project } from '@/types/project';

interface AdminLoginResult {
  success: true;
}

export function adminLogin(email: string, password: string): Promise<AdminLoginResult> {
  return apiClient.post<AdminLoginResult>('/admin/auth/login', { email, password });
}

export function adminLogout(): Promise<{ success: true }> {
  return apiClient.post('/admin/auth/logout');
}

export interface CreateProjectInput {
  title: string;
  slug: string;
  summary: string;
  techStack: string[];
  liveUrl?: string;
  repoUrl?: string;
  caseStudyBody?: string;
  published?: boolean;
}

export function createProject(input: CreateProjectInput): Promise<Project> {
  return apiClient.post<Project>('/admin/projects', input);
}
