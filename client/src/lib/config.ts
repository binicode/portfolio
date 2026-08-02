import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: z.string().min(1),
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
  NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
});

if (!parsed.success) {
  console.error('Invalid client environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid client environment configuration — check client/.env.local');
}

export const clientEnv = parsed.data;
