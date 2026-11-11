import type { MetadataRoute } from 'next';
import { apiClient } from '@/lib/api-client';
import { getProducts } from '@/lib/shopify-products';
import { clientEnv } from '@/lib/config';
import type { Project } from '@/types/project';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;

  // Each source fails independently, same reasoning as the aggregator
  // service — a Shopify outage shouldn't blank the entire sitemap.
  const [projects, products] = await Promise.all([
    apiClient.get<Project[]>('/projects', { next: { revalidate: 3600 } }).catch(() => [] as Project[]),
    getProducts().catch(() => []),
  ]);

  const latestProjectUpdate = projects.reduce<string | undefined>(
    (latest, p) => (!latest || p.updatedAt > latest ? p.updatedAt : latest),
    undefined,
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1, lastModified: latestProjectUpdate },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.8, lastModified: latestProjectUpdate },
    { url: `${siteUrl}/saas`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/shop`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    lastModified: project.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/shop/${product.handle}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...projectRoutes, ...productRoutes];
}
