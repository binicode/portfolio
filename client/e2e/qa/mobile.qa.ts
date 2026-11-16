import { expect, test } from './support/fixtures';
import { apiHasDatabase, testEmail } from './support/api';
import { readStream } from './support/sse';
import { QA } from './settings';

/**
 * The phone (and tablet) experience: touch, the menu, the assistant as a
 * near-full-screen panel, form inputs sized for the on-screen keyboard,
 * and the SaaS dashboard's compact top bar. Uses one or two auth attempts.
 */

test.use({ reducedMotion: 'no-preference' });
test.skip(({ isMobile }) => !isMobile, 'phone and tablet only');

test.beforeEach(async ({ diag }) => {
  diag.expect(/\/auth\/me/, 'signed-out session check');
});

test('phone visitor browses, uses the menu and asks the assistant', async ({ page, media, diag }, testInfo) => {
  media.video('mobile', 'touch-browse-menu-and-assistant-chat');
  const device = testInfo.project.name;

  await page.goto('/');
  await media.pause(1200);
  await media.shot('homepage', 'hero');

  // Scroll through the hero scene and the home page by touch-sized steps.
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 450);
    await page.waitForTimeout(160);
  }
  await media.pause(600);
  await media.shot('homepage', 'scrolled-into-home');
  await media.smoothScrollTo('top');

  // The menu (a popover below md).
  const menuButton = page.getByRole('button', { name: 'Menu' });
  if (await menuButton.isVisible()) {
    await menuButton.tap();
    const menu = page.locator('#site-menu');
    await expect(menu).toBeVisible();
    await media.pause(700);
    await media.shot(device as 'mobile' | 'tablet', 'site-menu-open');
    await menu.getByRole('link', { name: 'Work' }).tap();
  } else {
    await page.getByRole('navigation').first().getByRole('link', { name: 'Work', exact: true }).tap();
  }
  await expect(page).toHaveURL(/\/projects$/);
  await media.pause(900);
  await media.shot('portfolio', 'work-index');

  // The assistant on a small screen.
  await page.getByRole('button', { name: /^(Ask the assistant|Ask AI)$/ }).tap();
  const dialog = page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
  await expect(dialog).toBeVisible();
  await media.pause(700);
  await media.shot('ai-assistant', 'panel-open');

  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  diag.note('panelFitsScreen', { panel: box, viewport });
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);

  const input = dialog.getByLabel('Message', { exact: true });
  await input.tap();
  const fontSize = await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  diag.note('chatInputFontSizePx', fontSize);
  // Below 16 px, iOS Safari on a phone zooms the page when the field gets
  // focus. iPadOS Safari defaults to desktop mode and doesn't: phones only.
  if (device === 'mobile') expect.soft(fontSize, 'chat input font size (iOS zooms below 16 px)').toBeGreaterThanOrEqual(16);
  await input.pressSequentially('What is your background?', { delay: 30 });
  const answer = page.waitForResponse((r) => r.url().endsWith('/api/ai-chat/chat') && r.request().method() === 'POST');
  await dialog.getByRole('button', { name: 'Send message' }).tap();
  const summary = await readStream(await answer);
  diag.note('answer', summary);
  expect(summary.done?.usage?.outputTokens ?? 0).toBeGreaterThan(0);
  await expect(dialog.getByRole('log')).toContainText(summary.text.trim().slice(0, 30));
  await media.pause(1500);
  await media.shot('ai-assistant', 'chat-answer');

  // Into planning, a few taps.
  await dialog.getByRole('button', { name: 'Plan a project' }).tap();
  await dialog.getByRole('button', { name: 'Mobile app', exact: true }).tap();
  await dialog.getByRole('button', { name: 'Just an idea', exact: true }).tap();
  await expect(dialog.getByText(/What should .* solve\?/)).toBeVisible({ timeout: 20_000 });
  await media.pause(1500);
  await media.shot('ai-assistant', 'discovery-recommendation');
  await dialog.getByRole('button', { name: 'Close assistant' }).tap();
  await expect(dialog).toBeHidden();

  // No sideways scrolling anywhere on the way.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('phone customer signs in and reads the dashboard', async ({ page, media, diag, request }, testInfo) => {
  media.video('mobile', 'touch-saas-sign-up-and-dashboard');
  diag.expect(/saas\/auth/, 'auth calls');
  const hasDatabase = await apiHasDatabase(request);
  diag.note('database', hasDatabase);

  await page.goto('/saas/signup');
  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password');
  const sizes = await Promise.all([email, password].map((field) => field.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))));
  diag.note('formInputFontSizePx', sizes);
  if (testInfo.project.name === 'mobile') {
    for (const size of sizes) expect.soft(size, 'form input font size (iOS zooms below 16 px)').toBeGreaterThanOrEqual(16);
  }
  await email.tap();
  await email.fill(testEmail(`${testInfo.project.name}-user`));
  await password.fill(QA.saasPassword);
  await media.pause(600);
  await media.shot('dashboard', 'signup-form-filled');

  if (!hasDatabase) {
    test.skip(true, 'No database: SaaS accounts cannot be created');
  }

  await page.getByRole('button', { name: 'Create account' }).tap();
  await expect(page).toHaveURL(/\/saas\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Unlock your dashboard' })).toBeVisible();
  await media.pause(1200);
  await media.shot('dashboard', 'paywall', { fullPage: true });
  await media.smoothScrollTo('bottom');
  await media.pause(800);
  await media.smoothScrollTo('top');

  // The compact top bar carries Settings and Log out below lg.
  await page.getByRole('link', { name: 'Settings' }).first().tap();
  await expect(page).toHaveURL(/\/saas\/dashboard\/settings$/);
  await media.pause(800);
  await media.shot('dashboard', 'settings');
  await page.getByRole('button', { name: 'Log out' }).first().tap();
  await expect(page).toHaveURL(/\/saas\/login$/);
  await media.pause(800);
});
