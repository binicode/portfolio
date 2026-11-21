import path from 'node:path';
import { expect, test } from '@playwright/test';

// Full-page screenshots of every public page at phone, tablet and desktop
// widths, for a visual review: test-results/screens/<page>-<width>.png, also
// attached to the HTML report. Desktop project only (it sets each width).
const pages = [
  ['home', '/'],
  ['work', '/projects'],
  ['case-study', '/projects/fixture-storefront'],
  ['saas', '/saas'],
  ['saas-signup', '/saas/signup'],
  ['saas-login', '/saas/login'],
  ['shop', '/shop'],
  ['product', '/shop/fixture-desk-lamp'],
  ['not-found', '/no-such-page'],
] as const;
const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

test.use({ reducedMotion: 'reduce' });

for (const [name, route] of pages) {
  test(`screens: ${name}`, async ({ page, isMobile }, testInfo) => {
    test.skip(isMobile, 'the desktop project sets each width itself');
    // Three widths, each a full-page capture of a long page.
    test.setTimeout(120_000);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      // No horizontal scrolling at any width.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${name} at ${viewport.width}px`).toBeLessThanOrEqual(0);
      const file = path.join(testInfo.project.outputDir, 'screens', `${name}-${viewport.width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await testInfo.attach(`${name}-${viewport.width}`, { path: file, contentType: 'image/png' });
    }
  });
}
