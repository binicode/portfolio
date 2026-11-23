import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { APIRequestContext } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { apiHasDatabase, testEmail } from './support/api';
import { findSaasUser } from './support/db';
import { signToken, stripeSignature } from './support/jwt';
import { QA } from './settings';

/**
 * The Creator Dashboard (SaaS) as a new customer: sign up, sign out, sign in,
 * subscribe, connect sources, read the dashboard, and the boundaries between
 * two customers. Real API and local database. Stripe test mode creates the
 * checkout; the hosted checkout page itself is not loaded (its request is
 * answered 204 here), and the payment result arrives as a webhook signed with
 * the QA run's test secret, exactly as the API verifies Stripe's.
 *
 * Uses five of the API's ten auth attempts per 15 minutes.
 */

// In file order on the one worker (playwright.qa.config.ts). Not serial mode:
// a failed dashboard check must not skip the isolation test after it, which
// only needs the account the first test saves (see needsAccount).
test.skip(({ isMobile }) => isMobile, 'SaaS journeys run on desktop; the phone checks are in mobile.qa.ts');

const stateDir = path.resolve(__dirname, '../../test-results/qa-auth');
const userFile = path.join(stateDir, 'saas-user-a.json');
const accountFile = path.join(stateDir, 'saas-user-a.account.json');

const account = () => JSON.parse(readFileSync(accountFile, 'utf8')) as { email: string };

async function sendWebhook(request: APIRequestContext, event: object) {
  const payload = JSON.stringify(event);
  return request.post(`${QA.apiURL}/saas/billing/webhook`, {
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': stripeSignature(payload) },
    data: payload,
  });
}

test('new customer signs up, signs out and signs back in', async ({ page, media, diag, request }) => {
  media.video('authentication', 'saas-sign-up-sign-out-sign-in');
  diag.expect(/\/auth\/me/, 'signed-out session check');
  diag.expect(/saas\/auth\/(login|register)/, 'wrong password and duplicate sign-up tried on purpose');
  // A session left by an earlier run must not stand in for this one's.
  rmSync(stateDir, { recursive: true, force: true });
  const hasDatabase = await apiHasDatabase(request);
  diag.note('database', hasDatabase);
  const email = testEmail('user-a');

  await page.goto('/saas');
  await media.pause(900);
  await page.getByRole('link', { name: 'Create an account' }).first().click();
  await expect(page).toHaveURL(/\/saas\/signup$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Create an account' })).toBeVisible();
  await media.shot('dashboard', 'signup-form-empty');

  // The browser refuses a short password before anything is sent.
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  expect(await page.getByLabel('Password').evaluate((input: HTMLInputElement) => input.validity.tooShort)).toBe(true);
  await expect(page).toHaveURL(/\/saas\/signup$/);

  await page.getByLabel('Password').fill(QA.saasPassword);
  await media.pause(500);
  await media.shot('dashboard', 'signup-form-filled-password-masked');
  await page.getByRole('button', { name: 'Create account' }).click();

  if (!hasDatabase) {
    await expect(page.getByRole('main').getByRole('alert')).toBeVisible({ timeout: 30_000 });
    diag.note('signupErrorWithoutDatabase', await page.getByRole('main').getByRole('alert').innerText());
    await media.pause(900);
    await media.shot('errors', 'saas-signup-without-database');
    test.skip(true, 'No database: SaaS accounts cannot be created');
  }

  await expect(page).toHaveURL(/\/saas\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Unlock your dashboard' })).toBeVisible();
  await media.pause(1200);
  await media.shot('dashboard', 'new-account-subscription-paywall', { fullPage: true });

  // The account is in the database, with a hash, not the password.
  const stored = await findSaasUser(email);
  diag.note('storedUser', stored && { email: stored.email, subscriptionStatus: stored.subscriptionStatus, hasHash: typeof stored.passwordHash === 'string' && stored.passwordHash !== QA.saasPassword });
  expect(stored?.subscriptionStatus).toBe('none');
  expect(String(stored?.passwordHash)).toMatch(/^\$2[aby]\$/);

  // Sign out.
  await page.getByRole('button', { name: 'Log out' }).first().click();
  await expect(page).toHaveURL(/\/saas\/login$/);
  await media.pause(800);
  await page.goto('/saas/dashboard');
  await expect(page).toHaveURL(/\/saas\/login$/);
  await media.shot('dashboard', 'login-form');

  // Wrong password, then the right one.
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('wrong-password-123');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Invalid email or password');
  await media.pause(900);
  await media.shot('errors', 'saas-login-wrong-password');
  await page.getByLabel('Password').fill(QA.saasPassword);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/saas\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Unlock your dashboard' })).toBeVisible();
  await media.pause(900);

  // Session cookie: httpOnly, so page scripts can't read it.
  const cookies = await page.context().cookies(QA.apiOrigin);
  const session = cookies.find((cookie) => cookie.name === 'saas_token');
  diag.note('sessionCookie', session && { httpOnly: session.httpOnly, sameSite: session.sameSite, secure: session.secure });
  expect(session?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toContain('saas_token');

  // The same address again is refused with a readable message.
  const duplicate = await request.post(`${QA.apiURL}/saas/auth/register`, { data: { email, password: QA.saasPassword } });
  diag.note('duplicateSignup', { status: duplicate.status(), body: (await duplicate.text()).slice(0, 200) });
  expect.soft(duplicate.status(), 'duplicate sign-up status').toBe(409);

  mkdirSync(stateDir, { recursive: true });
  await page.context().storageState({ path: userFile });
  writeFileSync(accountFile, JSON.stringify({ email }));
});

// The tests below continue as the customer the first test created.
const needsAccount = () => test.skip(!existsSync(userFile), 'No account from the sign-up test (no database)');

test.describe('subscribed customer', () => {
  // Runs before the page (and its signed-in context) is created.
  test.beforeAll(needsAccount);
  test.use({ storageState: userFile });

  test('checkout, payment webhook, empty dashboard, connect sources, live dashboard', async ({ page, media, diag, request }) => {
    media.video('dashboard', 'saas-subscribe-connect-sources-live-dashboard');
    diag.expect(/checkout\.stripe\.com/, 'hosted checkout not loaded on purpose');
    const { email } = account();

    await page.goto('/saas/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Unlock your dashboard' })).toBeVisible();
    await media.pause(900);

    // Checkout: the API creates a Stripe test-mode session; the browser is sent there.
    let checkoutUrl = '';
    await page.route('https://checkout.stripe.com/**', async (route) => {
      checkoutUrl = route.request().url();
      await route.fulfill({ status: 204 });
    });
    const checkout = page.waitForResponse((r) => r.url().endsWith('/saas/billing/checkout'));
    await page.getByRole('button', { name: 'Continue to checkout' }).click();
    const checkoutResponse = await checkout;
    diag.note('checkoutStatus', checkoutResponse.status());
    if (checkoutResponse.status() !== 200) {
      diag.note('checkoutError', (await checkoutResponse.text()).slice(0, 300));
      await media.shot('errors', 'saas-checkout-error');
    }
    expect(checkoutResponse.status()).toBe(200);
    await expect.poll(() => checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    diag.note('checkoutHost', new URL(checkoutUrl).host);

    const stored = await findSaasUser(email);
    const customer = String(stored?.stripeCustomerId ?? '');
    diag.note('stripeCustomerStored', customer.startsWith('cus_'));
    expect(customer).toMatch(/^cus_/);

    // Payment completes: Stripe's webhook, signed with the run's test secret.
    const completed = {
      id: `evt_qa_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_qa', object: 'checkout.session', customer, subscription: 'sub_qa_test_1' } },
    };
    const webhook = await sendWebhook(request, completed);
    expect(webhook.status()).toBe(200);
    // Delivered twice (Stripe retries): same result, no error.
    const replay = await sendWebhook(request, completed);
    expect(replay.status()).toBe(200);
    expect((await findSaasUser(email))?.subscriptionStatus).toBe('active');

    // Subscribed, no sources yet: the empty state.
    await page.goto('/saas/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Unlock your dashboard' })).toHaveCount(0);
    await media.pause(1500);
    await media.shot('dashboard', 'subscribed-no-sources-empty-state', { fullPage: true });

    // Connect sources (public accounts, nothing personal).
    await page.goto('/saas/dashboard/settings');
    await expect(page.getByLabel('GitHub username')).toBeVisible();
    await media.shot('dashboard', 'settings-empty');
    await page.getByLabel('GitHub username').pressSequentially('octocat', { delay: 40 });
    await page.getByLabel('YouTube channel', { exact: true }).fill('UC_x5XG1OV2P6uZZ5FSM9Ttw');
    await page.getByLabel('Hacker News search term').pressSequentially('Next.js', { delay: 40 });
    await media.pause(600);
    await media.shot('dashboard', 'settings-filled');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page).toHaveURL(/\/saas\/dashboard$/);

    // Loading, then the live dashboard.
    const skeleton = page.locator('[aria-busy="true"]').first();
    if (await skeleton.isVisible().catch(() => false)) await media.shot('dashboard', 'live-dashboard-loading-skeleton');
    await expect(page.getByText(/Updated/).first()).toBeVisible({ timeout: 45_000 });
    await media.pause(1500);
    await media.shot('dashboard', 'live-dashboard-above-the-fold');
    await media.shot('dashboard', 'live-dashboard-full-page', { fullPage: true });
    // The header's own health line: "All 3 sources are live." or "2 of 3 … didn't respond."
    const health = page.getByText(/sources are live/).first();
    diag.note('sourcesSummary', await health.innerText());
    expect.soft(await health.innerText(), 'every connected source answered').toMatch(/^All 3 sources are live/);
    await media.smoothScrollTo('bottom');
    await media.pause(900);
    await media.smoothScrollTo('top');

    // Refresh re-fetches provider numbers.
    const refresh = page.getByRole('button', { name: /Refresh/ });
    await refresh.click();
    await expect(refresh).toBeEnabled({ timeout: 45_000 });
    await media.pause(900);

    // A source that can't be found: the dashboard says so instead of failing.
    await page.goto('/saas/dashboard/settings');
    await page.getByLabel('GitHub username').fill('qa-no-such-user-zz9-404-000');
    await page.getByRole('button', { name: 'Save settings' }).click();
    await expect(page).toHaveURL(/\/saas\/dashboard$/);
    await expect(page.getByText(/Updated/).first()).toBeVisible({ timeout: 45_000 });
    await media.pause(1200);
    await media.shot('errors', 'saas-dashboard-github-user-not-found', { fullPage: true });

    // Clearing a source: what the form sends, and whether the source goes.
    await page.goto('/saas/dashboard/settings');
    await page.getByLabel('YouTube channel', { exact: true }).fill('');
    const patchRequest = page.waitForRequest((r) => r.url().endsWith('/saas/settings') && r.method() === 'PATCH');
    await page.getByRole('button', { name: 'Save settings' }).click();
    const sent = (await patchRequest).postDataJSON() as Record<string, unknown>;
    await expect(page).toHaveURL(/\/saas\/dashboard$/);
    const afterClear = await (await page.request.get(`${QA.apiURL}/saas/auth/me`)).json();
    diag.note('clearYoutubeField', { requestBody: sent, youtubeChannelIdAfter: afterClear.youtubeChannelId ?? null });
    await page.goto('/saas/dashboard/settings');
    await media.shot('dashboard', 'settings-after-clearing-youtube');
    expect.soft(afterClear.youtubeChannelId ?? null, 'a cleared source is disconnected').toBeNull();

    // Subscription cancelled: the dashboard locks again.
    const cancelled = await sendWebhook(request, {
      id: `evt_qa_cancel_${Date.now()}`,
      object: 'event',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_qa_test_1', object: 'subscription', customer, status: 'canceled' } },
    });
    expect(cancelled.status()).toBe(200);
    await page.goto('/saas/dashboard');
    await expect(page.getByRole('heading', { level: 1, name: 'Unlock your dashboard' })).toBeVisible();
    await media.pause(1200);
    await media.shot('dashboard', 'after-cancellation-locked-again');
    const direct = await page.request.get(`${QA.apiURL}/saas/aggregator`);
    diag.note('aggregatorAfterCancel', direct.status());
    expect(direct.status()).toBe(402);
  });
});

test("one customer's data stays theirs", async ({ playwright, diag }) => {
  needsAccount();
  const a = account();
  const contextA = await playwright.request.newContext({ storageState: userFile });
  const contextB = await playwright.request.newContext();
  const emailB = testEmail('user-b');

  const register = await contextB.post(`${QA.apiURL}/saas/auth/register`, { data: { email: emailB, password: QA.saasPassword } });
  expect(register.status()).toBe(201);

  const meA = await (await contextA.get(`${QA.apiURL}/saas/auth/me`)).json();
  const meB = await (await contextB.get(`${QA.apiURL}/saas/auth/me`)).json();
  diag.note('meA', { email: meA.email === a.email, githubUsername: meA.githubUsername });
  diag.note('meB', { email: meB.email === emailB, githubUsername: meB.githubUsername ?? null });
  expect(meA.email).toBe(a.email);
  expect(meB.email).toBe(emailB);
  expect(meB.githubUsername).toBeUndefined();

  // B changes B's settings; A's are untouched.
  const patch = await contextB.patch(`${QA.apiURL}/saas/settings`, { data: { githubUsername: 'qa-user-b-github' } });
  expect(patch.status()).toBe(200);
  const meAAfter = await (await contextA.get(`${QA.apiURL}/saas/auth/me`)).json();
  expect(meAAfter.githubUsername).toBe(meA.githubUsername);

  // B's session can't be stretched to A's account: the id lives in a signed token.
  const stored = await findSaasUser(a.email);
  const forged = signToken({ sub: String(stored?._id), role: 'user', email: a.email }, { kind: 'customer', secret: 'guessed-secret-000000000000000000000000' });
  const asA = await contextB.get(`${QA.apiURL}/saas/auth/me`, { headers: { Authorization: `Bearer ${forged}` } });
  diag.note('forgedAsA', asA.status());
  expect(asA.status()).toBe(401);

  // B is unsubscribed: no dashboard data, whatever A has.
  expect((await contextB.get(`${QA.apiURL}/saas/aggregator`)).status()).toBe(402);
  // Neither customer reaches the admin API.
  expect((await contextB.get(`${QA.apiURL}/admin/projects`)).status()).toBe(401);

  await contextA.dispose();
  await contextB.dispose();
});
