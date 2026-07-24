import { z } from 'zod';

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  // Fail loudly at startup rather than producing a confusing "fetch
  // failed" error the first time some component tries to call the API.
  console.error('Invalid client environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid client environment configuration — check client/.env.local');
}

export const clientEnv = parsed.data;