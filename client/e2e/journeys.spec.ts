import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors } from './support';

// The journeys a visitor takes, against the fixture API
// (e2e/mock-api/server.mjs). Reduced motion keeps the hero static,
// so links and buttons are where a reader expects them.
test.use({ reducedMotion: 'reduce' });

const assistant = (page: Page) => page.locator('[role="dialog"][aria-labelledby="assistant-title"]');
const hero = (page: Page) => page.getByRole('region', { name: 'Your product, built to hold up.' });

test.describe('navigation', () => {
  test('desktop: the header reaches every section and marks the current page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the phone menu has its own test');
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Primary' });

    const stops: [string, RegExp, string | RegExp][] = [
      ['Work', /\/projects$/, 'Work'],
      ['SaaS', /\/saas$/, /One dashboard/],
    ];
    for (const [label, url, h1] of stops) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }

    await nav.getByRole('link', { name: 'About', exact: true }).click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('phone: the menu opens, navigates and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'desktop shows the links inline');
    await page.goto('/');
    await page.getByRole('button', { name: 'Menu' }).tap();
    const menu = page.locator('#site-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('button', { name: 'Plan your project' })).toBeVisible();
    await expect(menu.getByText('Free. 2 minutes. You keep the brief.')).toBeVisible();

    await menu.getByRole('link', { name: 'Work' }).tap();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(menu).toBeHidden();
  });
});

test('the planner runs from the first question to a brief', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/');
  const plan = hero(page).getByRole('button', { name: 'Plan your project' });
  await plan.click();

  const dialog = assistant(page);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Free. 2 minutes. You keep the brief. Tap any answer to change it.')).toBeVisible();

  // Answer every question with its first option until the brief appears.
  const brief = dialog.getByRole('heading', { name: 'Your project brief' });
  for (let step = 0; step < 15 && !(await brief.isVisible()); step++) {
    const question = dialog.getByRole('group').last();
    const prompt = await question.getAttribute('aria-labelledby');
    await question.getByRole('button', { pressed: false }).first().click();
    const next = question.getByRole('button', { name: 'Continue' });
    if ((await next.isVisible()) && (await next.isEnabled())) await next.click();
    // Wait for the next question (or the brief) before answering again.
    await expect
      .poll(async () => (await brief.isVisible()) || (await dialog.getByRole('group').last().getAttribute('aria-labelledby')) !== prompt)
      .toBe(true);
  }

  await expect(brief).toBeVisible();
  await expect(dialog.getByText('A test project from the end-to-end suite.')).toBeVisible();
  await expect(dialog.getByRole('link', { name: /Copy brief and message me/ })).toBeVisible();

  // Escape closes the panel and returns focus to the button that opened it.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(plan).toBeFocused();
  expect(errors).toEqual([]);
});

test('the assistant keeps keyboard focus inside while open', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard journey');
  await page.goto('/');
  await page.getByRole('button', { name: /Ask the assistant/ }).click();
  const dialog = assistant(page);
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((panel) => panel.contains(document.activeElement)), `focus after ${i + 1} tabs`).toBe(true);
  }
});

const MOCK_API = `http://localhost:${process.env.E2E_API_PORT ?? 4100}`;
const newEmail = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

/** The token the API would have emailed (the mock API keeps it for tests). */
async function emailedToken(page: Page, email: string, kind: 'verify' | 'reset'): Promise<string> {
  const response = await page.request.get(`${MOCK_API}/__test/last-link?email=${encodeURIComponent(email)}&kind=${kind}`);
  expect(response.ok(), `a ${kind} link was emailed to ${email}`).toBe(true);
  return ((await response.json()) as { token: string }).token;
}

async function signUp(page: Page, email: string, password: string) {
  await page.goto('/saas/signup');
  await expect(page.getByText('Free. Subscribe when you want your numbers.')).toBeVisible();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /create/i }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your inbox');
}

async function logIn(page: Page, email: string, password: string) {
  await page.goto('/saas/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/saas\/dashboard$/);
}

test('sign up, confirm the email, log out, log back in', async ({ page }) => {
  const email = newEmail();
  const password = 'fixture-password-1';
  await signUp(page, email, password);

  // The emailed link carries its token in the fragment; one click confirms and signs in.
  await page.goto(`/saas/verify-email#token=${await emailedToken(page, email, 'verify')}`);
  await page.getByRole('button', { name: 'Confirm and continue' }).click();

  // A new account has no subscription yet: the dashboard asks for one.
  await expect(page).toHaveURL(/\/saas\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unlock your dashboard');

  await page.getByRole('button', { name: 'Log out' }).first().click();
  await expect(page).toHaveURL(/\/saas\/login/);

  await logIn(page, email, password);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unlock your dashboard');
});

test('an unconfirmed account is asked to confirm before subscribing', async ({ page }) => {
  const email = newEmail();
  await signUp(page, email, 'fixture-password-1');
  await logIn(page, email, 'fixture-password-1');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Confirm your email');
  await page.getByRole('button', { name: 'Send a new link' }).click();
  await expect(page.getByText('Sent. The new link works for 24 hours.')).toBeVisible();
});

test('a used confirmation link is refused with a way forward', async ({ page }) => {
  const email = newEmail();
  await signUp(page, email, 'fixture-password-1');
  const token = await emailedToken(page, email, 'verify');
  await page.request.post(`${MOCK_API}/api/saas/auth/verify-email`, { data: { token } });

  await page.goto(`/saas/verify-email#token=${token}`);
  await page.getByRole('button', { name: 'Confirm and continue' }).click();
  await expect(page.getByText('This link has expired or was already used.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('forgot password: the reset link sets a new one and signs in', async ({ page }) => {
  const email = newEmail();
  await signUp(page, email, 'old-password-1');

  await page.goto('/saas/login');
  await page.getByRole('link', { name: 'Forgot your password?' }).click();
  await expect(page).toHaveURL(/\/saas\/forgot-password$/);
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your inbox');

  await page.goto(`/saas/reset-password#token=${await emailedToken(page, email, 'reset')}`);
  await page.getByLabel('New password').fill('new-password-2');
  await page.getByRole('button', { name: 'Save and sign in' }).click();
  await expect(page).toHaveURL(/\/saas\/dashboard$/);
  // The reset link proved the inbox, so the account is confirmed too.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Unlock your dashboard');

  await page.getByRole('button', { name: 'Log out' }).first().click();
  await logIn(page, email, 'new-password-2');
});

test('a reset page without a token says so and offers a new link', async ({ page }) => {
  await page.goto('/saas/reset-password');
  await expect(page.getByText('This link is incomplete.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save and sign in' })).toBeDisabled();
});

test('deleting the account from settings', async ({ page }) => {
  const email = newEmail();
  await signUp(page, email, 'fixture-password-1');
  await logIn(page, email, 'fixture-password-1');
  await page.goto('/saas/dashboard/settings');

  const password = page.getByLabel('Your password');
  await password.fill('wrong-password');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  await expect(page.getByText('That password is not right.')).toBeVisible();

  await password.fill('fixture-password-1');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  await expect(page).toHaveURL(/\/saas\/account-deleted$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your account is deleted');

  await page.goto('/saas/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('fixture-password-1');
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
});

test('a wrong password is refused with a message', async ({ page }) => {
  await page.goto('/saas/login');
  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await expect(page).toHaveURL(/\/saas\/login$/);
});

test('an unknown page is a real 404 with a way back', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page doesn’t exist.');
  expect((await page.goto('/projects/no-such-project'))?.status()).toBe(404);
});
