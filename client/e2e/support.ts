import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/**
 * Collects console errors and uncaught page errors from the moment it is
 * called. Read the array after the page has settled.
 */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      const { url, lineNumber } = message.location();
      errors.push(`console.error: ${message.text()}${url ? ` (${url}:${lineNumber})` : ''}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

/** Attaches a full-page screenshot to the test's entry in the HTML report. */
export async function attachFullPage(page: Page, testInfo: TestInfo, name = 'full-page'): Promise<void> {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

/**
 * Asserts that the element itself is what a pointer at its centre would hit,
 * not something layered over it (even an invisible one). Playwright's click
 * also checks this, but only reports it after the action timeout; this fails
 * at once and names the element in the way.
 */
export async function expectHitTarget(locator: Locator): Promise<void> {
  await expect(locator).toBeInViewport();
  const hit = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    const describe = (node: Element | null) =>
      node ? `<${node.tagName.toLowerCase()}${node.className ? ` class="${String(node.className)}"` : ''}>` : 'nothing';
    return { reachable: top !== null && element.contains(top), top: describe(top) };
  });
  expect(hit.reachable, `the topmost element at its centre is ${hit.top}`).toBe(true);
}
