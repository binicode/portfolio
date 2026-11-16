import { expect, test } from './support/fixtures';
import { apiHasDatabase } from './support/api';

/**
 * Every major page on every device: status, its one h1, no unexpected console
 * errors, and a full-page screenshot in screenshots/<device>/. Reduced motion
 * gives the static layout, so full-page shots show every section instead of
 * content waiting for a scroll-driven reveal.
 */

test.use({ reducedMotion: 'reduce' });

const pages = [
  { path: '/', name: 'home', h1: 'Software engineered to hold up.' },
  { path: '/projects', name: 'work-index', h1: 'Work' },
  { path: '/saas', name: 'saas-landing', h1: /Your reach, in one place\./ },
  { path: '/shop', name: 'shop-empty-state', h1: 'Shop' },
  { path: '/saas/signup', name: 'saas-signup', h1: 'Create an account' },
  { path: '/saas/login', name: 'saas-login', h1: 'Log in' },
  { path: '/login', name: 'admin-login', h1: 'Admin sign in' },
] as const;

for (const { path, name, h1 } of pages) {
  test(`${path} renders (${name})`, async ({ page, media, diag }, testInfo) => {
    // Signed out, the client asks the API who is signed in and gets 401: expected.
    diag.expect(/\/auth\/me/, 'signed-out session check');

    const response = await page.goto(path);
    expect(response?.status(), 'HTTP status').toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await page.waitForLoadState('networkidle');

    const device = testInfo.project.name as 'desktop' | 'tablet' | 'mobile';
    await media.shot(device, `${name}-full-page`, { fullPage: true });

    const title = await page.title();
    diag.note('title', title);
    diag.note('description', await page.locator('meta[name="description"]').getAttribute('content'));
    diag.note('canonical', await page.locator('link[rel="canonical"]').getAttribute('href').catch(() => null));

    // No horizontal scrolling at any width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);

    expect(diag.unexpected().filter((p) => p.kind === 'console-error' || p.kind === 'page-error')).toEqual([]);
  });
}

test('unknown page shows the not-found page with a 404', async ({ page, media, diag }, testInfo) => {
  diag.expect(/qa-page-that-does-not-exist/, 'the 404 under test');
  diag.expect(/\/auth\/me/, 'signed-out session check');

  const response = await page.goto('/qa-page-that-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
  await media.shot('errors', 'not-found-page', { fullPage: testInfo.project.name !== 'desktop' });
});

test('unknown case study shows the not-found page with a 404', async ({ page, media, diag, request }) => {
  diag.expect(/qa-missing-case-study/, 'the 404 under test');
  diag.expect(/\/auth\/me/, 'signed-out session check');
  const hasDatabase = await apiHasDatabase(request);

  const response = await page.goto('/projects/qa-missing-case-study');
  if (!hasDatabase) {
    // The API can't say "not found" without its database: the page's error boundary shows instead,
    // and logs React's production placeholder for a Server Component error (#441).
    diag.expect(/React error #441|Public route error/, 'error boundary logging the API failure (no database)');
    diag.note('statusWithoutDatabase', response?.status());
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    diag.note('errorPageHeading', await page.getByRole('heading', { level: 1 }).innerText());
    await media.shot('errors', 'case-study-when-api-has-no-database');
    test.skip(true, 'No database: a real 404 needs the API to look the slug up');
  }
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
  await media.shot('errors', 'case-study-not-found');
});

test('robots.txt and sitemap.xml are served', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Sitemap:/i);

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain('<urlset');
});
