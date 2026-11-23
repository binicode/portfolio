import { expect, test } from '@playwright/test';
import { attachFullPage, collectPageErrors } from './support';

// Key public pages: each answers 200, shows its h1, logs no console errors,
// and leaves a full-page screenshot in the HTML report for a visual check.
// Project data comes from e2e/fixtures/projects.json, through the stand-in
// in e2e/mock-api.
const pages = [
  { path: '/', h1: 'Your product, built to hold up.' },
  { path: '/projects', h1: 'Work' },
  { path: '/projects/fixture-storefront', h1: 'Fixture Storefront' },
  { path: '/saas', h1: /Stars, subscribers, mentions\. One dashboard\./ },
  { path: '/saas/signup', h1: 'Create an account' },
  { path: '/saas/login', h1: 'Log in' },
];

// Static layout (no scroll-driven reveals), so the full-page screenshots show
// every section rather than content still waiting to animate in.
test.use({ reducedMotion: 'reduce' });

for (const { path, h1 } of pages) {
  test(`${path} loads without console errors`, async ({ page }, testInfo) => {
    const errors = collectPageErrors(page);

    const response = await page.goto(path);
    expect(response?.status(), 'HTTP status').toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);

    // Let hydration, lazy chunks and prefetches finish before judging the console.
    await page.waitForLoadState('networkidle');
    await attachFullPage(page, testInfo);

    expect(errors).toEqual([]);
  });
}

test('structured data is valid JSON with the expected types', async ({ page }) => {
  await page.goto('/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks.length).toBeGreaterThan(0);
  const types = blocks.flatMap((text) => [JSON.parse(text)].flat().map((item: { '@type': string }) => item['@type']));
  expect(types).toEqual(expect.arrayContaining(['Person', 'WebSite']));
});
