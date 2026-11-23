import { z } from 'zod';
import { parseTrustProxy } from './trust-proxy.js';
import { parseClientOrigins } from './origins.js';
import { parseCookieDomain } from './session-cookie.js';

// Read from the process environment. Locally, `npm run dev`, `npm start`
// and `npm run seed:kb` load server/.env into it first (Node's
// --env-file-if-exists); a variable already set in the environment wins.

/**
 * Treats empty-string env vars as "not provided." Without this, an
 * optional field left blank in .env (e.g. `STRIPE_SECRET_KEY=`) fails
 * validation instead of being treated as absent, since env files load
 * blank values as "" rather than undefined.
 */
const optionalString = (schema: z.ZodType<string>) =>
    z.preprocess((val) => (val === '' ? undefined : val), schema.optional());

// An email sender: "Name <address>" or a bare address.
const SENDER = /^(?:[^<>\r\n]+ <[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+>|[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)$/;

const envSchema = z.object({
    // --- Core server ---
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    // --- Database ---
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

    // --- CORS: one origin or a comma-separated list; the first is the public site (origins.ts) ---
    CLIENT_ORIGIN: z
        .string()
        .default('http://localhost:3000')
        .superRefine((value, ctx) => {
            try {
                parseClientOrigins(value);
            } catch (error) {
                ctx.addIssue({ code: 'custom', message: (error as Error).message });
            }
        }),

    // --- Proxies in front of the API (see trust-proxy.ts) ---
    TRUST_PROXY: z
        .string()
        .optional()
        .transform((value, ctx) => {
            try {
                return parseTrustProxy(value);
            } catch (error) {
                ctx.addIssue({ code: 'custom', message: (error as Error).message });
                return z.NEVER;
            }
        }),

    // --- Auth (needed by admin-cms + saas-mvp modules) ---
    // The site's domain when the API is on another host of it (session-cookie.ts).
    COOKIE_DOMAIN: z
        .string()
        .optional()
        .transform((value, ctx) => {
            try {
                return parseCookieDomain(value);
            } catch (error) {
                ctx.addIssue({ code: 'custom', message: (error as Error).message });
                return z.NEVER;
            }
        }),
    // Required: without it no one can sign in, and a server that starts anyway
    // only fails later, on the first sign-in.
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    ADMIN_EMAIL: z.email(),
    ADMIN_PASSWORD_HASH: z.string().min(1),

    // --- AI chat module ---
    GEMINI_API_KEY: optionalString(z.string().min(1)),
    VOYAGE_API_KEY: optionalString(z.string().min(1)),
    // The most the assistant and the planner may spend on Gemini per UTC day,
    // in US dollars at paid-tier prices (ai-budget.ts).
    AI_DAILY_COST_CAP_USD: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().positive().max(1000).default(1)),

    // --- SaaS MVP billing module ---
    STRIPE_SECRET_KEY: optionalString(z.string().min(1)),
    STRIPE_WEBHOOK_SECRET: optionalString(z.string().min(1)),
    STRIPE_PRO_PRICE_ID: optionalString(z.string().min(1)),
    GITHUB_API_TOKEN: optionalString(z.string().min(1)),
    YOUTUBE_API_KEY: optionalString(z.string().min(1)),

    // --- Email (Resend, email.ts): off without RESEND_API_KEY ---
    RESEND_API_KEY: optionalString(z.string().min(1)),
    // The sender, on the domain verified in Resend.
    EMAIL_FROM: optionalString(z.string().regex(SENDER, 'EMAIL_FROM must be "Name <address>" or an address')),
    // Where new-enquiry alerts go. No alerts without it.
    ALERT_EMAIL_TO: optionalString(z.email()),
}).superRefine((value, ctx) => {
    if (value.RESEND_API_KEY && !value.EMAIL_FROM) {
        ctx.addIssue({ code: 'custom', path: ['EMAIL_FROM'], message: 'EMAIL_FROM is required when RESEND_API_KEY is set' });
    }
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
        console.error('❌ Invalid environment variables:');
        console.error(z.flattenError(parsed.error).fieldErrors);
        process.exit(1);
    }

    return parsed.data;
}

export const env = loadEnv();