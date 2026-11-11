import 'server-only';
import { notFound } from 'next/navigation';
import { apiClient, ApiError } from './api-client';
import type { Project } from '@/types/project';

const REVALIDATE_SECONDS = 60;

export interface ProjectList {
  projects: Project[];
  /** True when the API could not be reached and there was no cached copy. */
  unavailable: boolean;
}

/**
 * Published projects, newest first. A failed request degrades to an empty
 * list with `unavailable: true` instead of failing the whole page; the
 * fetch data cache still serves the last good response while it is warm.
 */
export async function getProjects(): Promise<ProjectList> {
  try {
    const projects = await apiClient.get<Project[]>('/projects', { next: { revalidate: REVALIDATE_SECONDS } });
    const sorted = [...projects].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return { projects: sorted, unavailable: false };
  } catch {
    return { projects: [], unavailable: true };
  }
}

/** One published project, or the route's not-found page. */
export async function getProject(slug: string): Promise<Project> {
  try {
    return await apiClient.get<Project>(`/projects/${encodeURIComponent(slug)}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    throw error;
  }
}

export function projectYear(project: Project): number {
  return new Date(project.createdAt).getUTCFullYear();
}
