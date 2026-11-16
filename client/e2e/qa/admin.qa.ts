import { expect, test } from './support/fixtures';
import { apiHasDatabase } from './support/api';
import { QA } from './settings';

/**
 * The admin CMS: guarded routes, sign in with the QA run's test admin (never
 * the real one: start-api.mjs replaces it), the projects list, create, edit,
 * publish, delete and sign out. Uses two of the API's ten auth attempts.
 */

test.describe.configure({ mode: 'serial' });
test.skip(({ isMobile }) => isMobile, 'admin runs on desktop');

const project = {
  title: 'QA Run Inventory Tracker',
  summary: 'Test data created by the QA run: an inventory tracker case study used to check create, edit and publish.',
  techStack: 'Next.js, Express, MongoDB',
  caseStudy: '## Problem\nTest paragraph written by the QA run.\n\n## Approach\n- Server-rendered pages\n- Validated API inputs\n\n## Outcome\nThe case study renders headings, lists and paragraphs.',
};

test('signed out, /dashboard redirects to the admin sign-in', async ({ page, media, diag }) => {
  diag.expect(/\/auth\/me/, 'signed-out session check');
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Admin sign in');
  await media.shot('admin', 'signed-out-redirected-to-sign-in');
  await page.goto('/dashboard/projects/new');
  await expect(page).toHaveURL(/\/login$/);
});

test('admin signs in, manages a project and signs out', async ({ page, media, diag, request }) => {
  media.video('admin', 'admin-sign-in-create-edit-publish-delete');
  diag.expect(/admin\/auth\/login/, 'wrong password tried on purpose');
  diag.expect(/409.*\/api\/admin\/projects/, 'duplicate slug tried on purpose');
  diag.expect(/\/auth\/me/, 'signed-out session check');
  const hasDatabase = await apiHasDatabase(request);
  diag.note('database', hasDatabase);

  await page.goto('/login');
  await media.pause(700);
  const email = page.getByLabel('Email');
  const password = page.getByLabel('Password');

  // Wrong password first.
  await email.fill(QA.admin.email);
  await password.fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Invalid email or password');
  await media.pause(900);
  await media.shot('admin', 'sign-in-wrong-password-error');

  await password.fill(QA.admin.password);
  await media.shot('admin', 'sign-in-form-filled-password-masked');
  await page.getByRole('button', { name: 'Sign in' }).click();

  if (!hasDatabase) {
    // Signed in (the admin identity needs no database), but the projects list does.
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await media.pause(1200);
    await media.shot('errors', 'admin-dashboard-without-database', { fullPage: true });
    diag.note('dashboardHeading', await page.getByRole('heading', { level: 1 }).innerText());
    test.skip(true, 'No database: project create/edit/delete cannot run');
  }

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Admin' })).toContainText(QA.admin.email);
  await media.pause(900);
  await media.shot('admin', 'projects-list', { fullPage: true });

  // Create, as a draft.
  await page.getByRole('link', { name: 'New project' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'New project' })).toBeVisible();
  await page.getByLabel('Title').pressSequentially(project.title, { delay: 20 });
  await expect(page.getByLabel('Slug')).toHaveValue('qa-run-inventory-tracker');
  await page.getByLabel('Summary').fill(project.summary);
  await page.getByLabel('Tech stack').fill(project.techStack);
  await page.getByLabel('Live URL (optional)').fill('https://example.com/qa-inventory');
  await page.getByLabel('Case study (optional)').fill(project.caseStudy);
  await media.pause(600);
  await media.shot('admin', 'new-project-form-filled');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const row = page.locator('li', { hasText: project.title });
  await expect(row).toBeVisible();
  await expect(row).toContainText('Draft');
  await media.pause(900);
  await media.shot('admin', 'projects-list-with-new-draft');

  // A draft is not public.
  const draftPublic = await request.get(`${QA.apiURL}/projects/qa-run-inventory-tracker`);
  diag.note('draftPublicStatus', draftPublic.status());
  expect(draftPublic.status()).toBe(404);

  // Duplicate slug is refused with a readable error.
  await page.getByRole('link', { name: 'New project' }).click();
  await page.getByLabel('Title').fill(project.title);
  await page.getByLabel('Summary').fill('Duplicate slug check.');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toBeVisible();
  diag.note('duplicateSlugError', await page.getByRole('main').getByRole('alert').innerText());
  await media.shot('errors', 'admin-duplicate-slug-error');
  await page.goto('/dashboard');

  // Edit: new summary, published.
  await row.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Edit project' })).toBeVisible();
  await page.getByLabel('Summary').fill(`${project.summary} Edited and published by the QA run.`);
  await page.getByLabel(/Publish/).check();
  await media.pause(600);
  await media.shot('admin', 'edit-project-form');
  await page.getByRole('button', { name: /^Save/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(row).toContainText('Published');
  await media.pause(900);
  await media.shot('admin', 'projects-list-after-publish');

  // Now public, with the edit.
  const published = await request.get(`${QA.apiURL}/projects/qa-run-inventory-tracker`);
  expect(published.status()).toBe(200);
  expect((await published.json()).summary).toContain('Edited and published by the QA run.');
  await page.goto('/projects/qa-run-inventory-tracker');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
  await media.pause(1200);
  await media.shot('portfolio', 'case-study-created-by-admin', { fullPage: true });

  // Delete (with the confirm dialog).
  await page.goto('/dashboard');
  await row.getByRole('link', { name: 'Edit' }).click();
  page.once('dialog', (dialog) => {
    diag.note('deleteConfirm', dialog.message());
    void dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('li', { hasText: project.title })).toHaveCount(0);
  await media.pause(900);

  // Sign out: the dashboard is guarded again.
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await media.pause(700);
});
