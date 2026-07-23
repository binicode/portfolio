import { config } from 'dotenv';
import { z } from 'zod';

config();

/**
 * Treats empty-string env vars as "not provided." Without this, an
 * optional field left blank in .env (e.g. `STRIPE_SECRET_KEY=`) fails
 * validation instead of being treated as absent, since dotenv loads
 * blank values as "" rather than undefined.
 */
const optionalString = (schema: z.ZodString) =>
    z.preprocess((val) => (val === '' ? undefined : val), schema.optional());

const envSchema = z.object({
    // --- Core server ---
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    // --- Database ---
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // --- CORS ---
    CLIENT_ORIGIN: z.string().url().default('http://localhost:3000'),

    // --- Auth (needed by admin-cms + saas-mvp modules) ---
    JWT_SECRET: optionalString(z.string().min(32, 'JWT_SECRET must be at least 32 characters')),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD_HASH: z.string().min(1),

    // --- AI chat module ---
    ANTHROPIC_API_KEY: optionalString(z.string().min(1)),
    OPENAI_API_KEY: optionalString(z.string().min(1)),
    VOYAGE_API_KEY: optionalString(z.string().min(1)),

    // --- SaaS MVP billing module ---
    STRIPE_SECRET_KEY: optionalString(z.string().min(1)),
    STRIPE_WEBHOOK_SECRET: optionalString(z.string().min(1)),

    // --- Storefront module ---
    SHOPIFY_STOREFRONT_ACCESS_TOKEN: optionalString(z.string().min(1)),
    SHOPIFY_STORE_DOMAIN: optionalString(z.string().min(1)),
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