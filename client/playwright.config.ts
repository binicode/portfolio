import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a production build (`next build` + `next start`).
 *
 * Playwright starts two servers, in order:
 *   1. e2e/mock-api/server.mjs, fixture stand-ins for the Express API (HTTP)
 *      and the Shopify Storefront API (HTTPS, self-signed), so neither the
 *      build nor the tests need MongoDB, Stripe, Shopify or Gemini
 *      credentials;
 *   2. the client, built and started with public values that point at the
 *      mock. The mock runs first because `next build` fetches projects to
 *      prerender the home page, /projects and /projects/[slug].
 *
 * Ports 3100 and 4100 keep clear of a local `next dev` (3000) and the real
 * API (4000). The build writes to .next, replacing any earlier build there.
 */

const PORT = Number(process.env.E2E_PORT ?? 3100);
const API_PORT = Number(process.env.E2E_API_PORT ?? 4100);
const SHOP_PORT = Number(process.env.E2E_SHOP_PORT ?? 4143);
const baseURL = `http://localhost:${PORT}`;
// localhost, like the site: the session cookie is SameSite=Strict, and
// localhost and 127.0.0.1 are different sites to a browser.
const apiURL = `http://localhost:${API_PORT}/api`;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    // An action that cannot happen (e.g. a click another element would
    // intercept) fails after 10 s with the reason, not at the test timeout.
    actionTimeout: 10_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // The Shopify stand-in's certificate is self-signed (Buy now calls it from the browser).
    ignoreHTTPSErrors: true,
  },
  // Chromium only, to keep installs small. Pixel 7 is a Chromium phone
  // profile (touch, mobile viewport); iPhone profiles would need WebKit.
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      name: 'mock-api',
      command: 'node e2e/mock-api/server.mjs',
      url: `${apiURL}/health`,
      env: { MOCK_API_PORT: String(API_PORT), MOCK_SHOP_PORT: String(SHOP_PORT) },
      reuseExistingServer: !isCI,
      timeout: 15_000,
    },
    {
      name: 'next',
      command: `npm run build && npm run start -- --port ${PORT}`,
      url: baseURL,
      // Set in the environment, these win over any client/.env* file.
      env: {
        NEXT_TELEMETRY_DISABLED: '1',
        NEXT_PUBLIC_API_URL: apiURL,
        NEXT_PUBLIC_SITE_URL: baseURL,
        // The Shopify stand-in: no request reaches a real store. Its
        // certificate is self-signed, so TLS verification is off for this
        // test-only Next server process (never set it anywhere else).
        NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: `127.0.0.1:${SHOP_PORT}`,
        NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN: 'e2e-placeholder',
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
      reuseExistingServer: !isCI,
      // Includes the production build.
      timeout: 300_000,
    },
  ],
});
