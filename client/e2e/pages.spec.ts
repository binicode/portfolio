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
  { path: '/saas/forgot-password', h1: 'Reset your password' },
  { path: '/privacy', h1: 'Privacy' },
  { path: '/terms', h1: 'Terms' },
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

// A page that sets its own Open Graph fields replaces the layout's (Next.js
// merges metadata shallowly): every public page must still carry the shared
// ones, so a shared link shows the image and the site's name.
for (const path of ['/', '/projects', '/projects/fixture-storefront', '/saas', '/privacy', '/terms']) {
  test(`${path} has complete link-preview metadata`, async ({ page, request }) => {
    await page.goto(path);
    const og = async (property: string) => page.locator(`meta[property="og:${property}"]`).getAttribute('content');
    expect(await og('site_name')).toBe('Biniyam Abera');
    expect(await og('locale')).toBe('en_US');
    expect(await og('type')).toBe(path.startsWith('/projects/') ? 'article' : 'website');
    expect(await og('url')).toMatch(new RegExp(`${path === '/' ? '' : path}$`));
    expect(await og('title')).toBeTruthy();
    expect(await og('description')).toBeTruthy();

    const image = await og('image');
    expect(image).toMatch(/\/opengraph-image$/);
    expect(await og('image:alt')).toMatch(/Biniyam Abera/);
    const response = await request.get(new URL(image!).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(await page.locator('meta[name="twitter:image"]').getAttribute('content')).toMatch(/\/opengraph-image$/);
  });
}
