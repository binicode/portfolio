import { defineConfig, devices } from '@playwright/test';
import { QA } from './settings';

/**
 * The full QA run: complete journeys against the real API, recorded.
 * Separate from the smoke suite (../../playwright.config.ts), which stays as
 * it is: specs here are named *.qa.ts, so the smoke config never picks them up.
 *
 *   npm run test:qa                       build, start, run every device
 *   QA_SKIP_BUILD=1 npm run test:qa -- mobile   one device, last build
 *
 * Servers, in order:
 *   1. the real Express API (start-api.mjs) on 4200, with test-only admin,
 *      JWT and webhook secrets and a local database (settings.ts);
 *   2. the client: seed-local.mjs puts the fixture case studies in the local
 *      database (when one is running), then the client is built against the
 *      API and started on 3200.
 *
 * Every test records a video; the journeys keep theirs in portfolio-media/
 * (support/fixtures.ts). Screenshots are taken at 2x on desktop and tablet,
 * 3x on the phone.
 */

const skipBuild = process.env.QA_SKIP_BUILD === '1';
const pacing = Number(process.env.QA_SLOWMO ?? 120);

const desktop = { width: 1280, height: 800 };
const tablet = devices['Galaxy Tab S4'];
const phone = devices['Pixel 7'];

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.qa.ts',
  outputDir: '../../test-results/qa',
  // Journeys share one API process and its rate limits (10 auth attempts per
  // 15 minutes per IP): one worker keeps them in a known order.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report/qa' }]],
  use: {
    baseURL: QA.baseURL,
    actionTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { slowMo: pacing },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: desktop,
        deviceScaleFactor: 2,
        video: { mode: 'on', size: desktop },
      },
    },
    {
      name: 'tablet',
      use: {
        ...tablet,
        defaultBrowserType: 'chromium',
        deviceScaleFactor: 2,
        video: { mode: 'on', size: tablet.viewport },
      },
    },
    {
      name: 'mobile',
      use: {
        ...phone,
        deviceScaleFactor: 3,
        video: { mode: 'on', size: phone.viewport },
      },
    },
  ],
  webServer: [
    {
      name: 'api',
      command: 'node e2e/qa/start-api.mjs',
      cwd: '../..',
      url: `${QA.apiOrigin}/health`,
      env: {
        QA_API_PORT: String(QA.apiPort),
        QA_BASE_URL: QA.baseURL,
        QA_MONGODB_URI: QA.mongoUri,
        QA_JWT_SECRET: QA.jwtSecret,
        QA_ADMIN_EMAIL: QA.admin.email,
        QA_ADMIN_PASSWORD: QA.admin.password,
        QA_STRIPE_WEBHOOK_SECRET: QA.stripeWebhookSecret,
        ...(process.env.QA_SERVER_ENV_FILE ? { QA_SERVER_ENV_FILE: process.env.QA_SERVER_ENV_FILE } : {}),
      },
      // A fresh API per run: its rate-limit counters and in-memory chat
      // history start empty.
      reuseExistingServer: false,
      stdout: 'pipe',
      timeout: 60_000,
    },
    {
      name: 'client',
      // The seed runs first, so the build prerenders the fixture case studies.
      command: `node e2e/qa/seed-local.mjs && ${skipBuild ? '' : 'npm run build && '}npm run start -- --port ${QA.port}`,
      cwd: '../..',
      url: QA.baseURL,
      env: {
        QA_MONGODB_URI: QA.mongoUri,
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_API_URL: QA.apiURL,
        NEXT_PUBLIC_SITE_URL: QA.baseURL,
        // No store behind the shop in QA: it renders its empty state.
        NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: 'qa-placeholder.invalid',
        NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'qa-placeholder',
      },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
