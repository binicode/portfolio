import type { MetadataRoute } from 'next';
import { apiClient } from '@/lib/api-client';
import { clientEnv } from '@/lib/config';
import type { Project } from '@/types/project';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;

  // An API outage leaves out the case studies rather than failing the
  // whole sitemap; the static routes are always listed.
  const projects = await apiClient
    .get<Project[]>('/projects', { next: { revalidate: 3600 } })
    .catch(() => [] as Project[]);

  const latestProjectUpdate = projects.reduce<string | undefined>(
    (latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    undefined,
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1, lastModified: latestProjectUpdate },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.8, lastModified: latestProjectUpdate },
    { url: `${siteUrl}/saas`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    lastModified: project.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}
