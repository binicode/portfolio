import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// axe on the key screens, desktop and phone. Serious and critical issues
// fail the test; the full list (moderate and minor too) is attached to the
// report. axe can't judge text over gradients, so those pairs are checked by
// construction (DESIGN-SYSTEM.md, Color).
const pages = [
  '/',
  '/projects',
  '/projects/fixture-storefront',
  '/saas',
  '/saas/signup',
  '/saas/login',
  '/saas/forgot-password',
  '/saas/reset-password',
  '/saas/verify-email',
  '/privacy',
  '/terms',
  '/no-such-page',
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.use({ reducedMotion: 'reduce' });

for (const path of pages) {
  test(`axe: ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    await testInfo.attach('axe-violations.json', { body: JSON.stringify(results.violations, null, 2), contentType: 'application/json' });
    const blocking = results.violations
      .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
      .map(
        (violation) =>
          `${violation.impact}: ${violation.id} (${violation.nodes.length}) ${violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(' '))
            .join(' | ')}`,
      );
    expect(blocking).toEqual([]);
  });
}

test('the assistant panel passes axe when open', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the assistant|Ask AI/ }).click();
  await expect(page.locator('#assistant-panel')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('#assistant-panel').withTags(TAGS).analyze();
  expect(results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
});
