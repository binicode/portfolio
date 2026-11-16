/**
 * Settings for the QA run (playwright.qa.config.ts).
 *
 * Every credential here is a test value that only exists for this run: the
 * API is started with them on the command line (start-api.mjs), so it never
 * sees the real admin identity, JWT secret, webhook secret or database from
 * server/.env. Provider keys (Gemini, Voyage, GitHub, YouTube, Stripe test
 * mode) do come from that file, so AI answers and provider data are real.
 *
 * Ports 3200/4200 keep clear of `next dev` (3000), the real API (4000) and
 * the smoke suite (3100/4100).
 */
import path from 'node:path';

const PORT = Number(process.env.QA_PORT ?? 3200);
const API_PORT = Number(process.env.QA_API_PORT ?? 4200);

export const QA = {
  port: PORT,
  apiPort: API_PORT,
  baseURL: `http://localhost:${PORT}`,
  /** `localhost` on both sides, so the API's cookies reach the client's server too. */
  apiOrigin: `http://localhost:${API_PORT}`,
  apiURL: `http://localhost:${API_PORT}/api`,
  /**
   * A local, throwaway database. start-api.mjs and seed-local.mjs refuse
   * anything that isn't on this machine, so the QA run can never write to
   * Atlas. When nothing listens here, the API starts without a database
   * (see server db.ts) and the database steps are skipped.
   */
  mongoUri: process.env.QA_MONGODB_URI ?? 'mongodb://127.0.0.1:27018/portfolio-qa',
  jwtSecret: 'qa-only-jwt-secret-for-local-runs-0000000000',
  stripeWebhookSecret: 'whsec_qa_only_local_test_secret',
  admin: { email: 'qa.admin@example.com', password: 'qa-admin-test-password' },
  /** SaaS users are created per run with unique addresses (support/api.ts testEmail). */
  saasPassword: 'qa-user-test-password',
  /**
   * Where screenshots, videos and evidence go: repo-root portfolio-media/, or
   * QA_MEDIA_DIR (e.g. a scratch folder, to re-check one thing without
   * replacing a full run's media).
   */
  mediaDir: process.env.QA_MEDIA_DIR
    ? path.resolve(process.env.QA_MEDIA_DIR)
    : path.resolve(__dirname, '../../../portfolio-media'),
} as const;
