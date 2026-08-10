import type { MetadataRoute } from 'next';
import { apiClient } from '@/lib/api-client';
import { getProducts } from '@/lib/shopify-products';
import { clientEnv } from '@/lib/config';
import type { Project } from '@/types/project';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = clientEnv.NEXT_PUBLIC_SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    { url: `${siteUrl}/projects`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${siteUrl}/shop`, changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Each source fails independently, same reasoning as the aggregator
  // service — a Shopify outage shouldn't blank the entire sitemap.
  const [projects, products] = await Promise.all([
    apiClient.get<Project[]>('/projects').catch(() => []),
    getProducts().catch(() => []),
  ]);

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${siteUrl}/projects/${project.slug}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${siteUrl}/shop/${product.handle}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...projectRoutes, ...productRoutes];
}
