import { expect, test } from '@playwright/test';
import { attachFullPage, collectPageErrors } from './support';

// Key public pages: each answers 200, shows its h1, logs no console errors,
// and leaves a full-page screenshot in the HTML report for a visual check.
// Project data comes from e2e/fixtures/projects.json through the mock API;
// the shop has no store behind it in tests, so it shows its empty state.
const pages = [
  { path: '/', h1: 'Software engineered to hold up.' },
  { path: '/projects', h1: 'Work' },
  { path: '/projects/fixture-storefront', h1: 'Fixture Storefront' },
  { path: '/saas', h1: /Your reach, in one place\./ },
  { path: '/saas/signup', h1: 'Create an account' },
  { path: '/shop', h1: 'Shop' },
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
