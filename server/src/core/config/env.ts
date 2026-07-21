import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  // --- Core server ---
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // --- Database ---
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // --- CORS ---
  CLIENT_ORIGIN: z.string().url().default('http://localhost:3000'),

  // --- Auth (needed by admin-cms + saas-mvp modules) ---
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),

  // --- AI chat module ---
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),

  // --- SaaS MVP billing module ---
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),

  // --- Storefront module ---
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1).optional(),
  SHOPIFY_STORE_DOMAIN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();