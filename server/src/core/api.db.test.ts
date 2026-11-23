// Run with `npm test` in server/. The API end to end against a real MongoDB
// (in memory): accounts, sessions, roles, the subscription gate, settings,
// the CMS and public reads. The tests share one database and run in order.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN, startDatabaseApp, type DatabaseApp } from '../test-support/database-app.js';

let app: DatabaseApp;
let customer: string | undefined;
let admin: string | undefined;
let projectId: string;

before(async () => {
  app = await startDatabaseApp();
});

after(async () => {
  await app?.stop();
});

test('health reports the database as connected', async () => {
  const { status, body } = await app.call('/health');
  assert.equal(status, 200);
  assert.equal(body.database, 'connected');
});

test('sign-up creates an account and a customer session', async () => {
  const { status, cookie } = await app.post('/api/saas/auth/register', { email: 'Customer@Example.com', password: 'correct-horse-1' });
  assert.equal(status, 201);
  assert.match(cookie ?? '', /^saas_token=/);
});

test('sign-up rejects invalid input with field messages', async () => {
  const { status, body } = await app.post('/api/saas/auth/register', { email: 'not-an-email', password: 'short' });
  assert.equal(status, 400);
  assert.ok(body.error.details.email);
  assert.ok(body.error.details.password);
});

test('log-in matches the email case-insensitively', async () => {
  const { status, cookie } = await app.post('/api/saas/auth/login', { email: 'customer@example.com', password: 'correct-horse-1' });
  assert.equal(status, 200);
  customer = cookie;
  assert.match(customer ?? '', /^saas_token=/);
});

test('a wrong password is refused', async () => {
  const { status } = await app.post('/api/saas/auth/login', { email: 'customer@example.com', password: 'wrong-password' });
  assert.equal(status, 401);
});

test('the session returns the account, and no session is refused', async () => {
  const me = await app.call('/api/saas/auth/me', {}, customer);
  assert.equal(me.status, 200);
  assert.equal(me.body.email, 'customer@example.com');
  assert.equal(me.body.subscriptionStatus, 'none');
  assert.equal((await app.call('/api/saas/auth/me')).status, 401);
});

test('settings store a pasted profile link as the bare username', async () => {
  const { status, body } = await app.patch('/api/saas/settings', { githubUsername: 'https://github.com/octocat' }, customer);
  assert.equal(status, 200);
  assert.equal(body.githubUsername, 'octocat');
});

test('dashboard data needs an active subscription', async () => {
  const { status } = await app.call('/api/saas/aggregator', {}, customer);
  assert.equal(status, 402);
});

test('admin sign-in sets the admin session', async () => {
  const { status, cookie } = await app.post('/api/admin/auth/login', ADMIN);
  assert.equal(status, 200);
  admin = cookie;
  assert.match(admin ?? '', /^admin_token=/);
});

test('a customer token cannot reach admin routes', async () => {
  const forged = customer?.replace('saas_token', 'admin_token');
  assert.equal((await app.call('/api/admin/projects', {}, forged)).status, 403);
  assert.equal((await app.call('/api/admin/projects')).status, 401);
});

test('a new project starts as a draft that is not public', async () => {
  const created = await app.post('/api/admin/projects', { title: 'Test project', slug: 'test-project', summary: 'A summary.', techStack: ['TypeScript'] }, admin);
  assert.equal(created.status, 201);
  assert.equal(created.body.published, false);
  projectId = created.body._id;
  const list = await app.call('/api/projects');
  assert.deepEqual(list.body, []);
  assert.equal((await app.call('/api/projects/test-project')).status, 404);
});

test('publishing makes the project public', async () => {
  const updated = await app.patch(`/api/admin/projects/${projectId}`, { published: true }, admin);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.published, true);
  const one = await app.call('/api/projects/test-project');
  assert.equal(one.status, 200);
  assert.equal(one.body.slug, 'test-project');
});

test('an invalid slug is refused', async () => {
  const { status } = await app.post('/api/admin/projects', { title: 'X', slug: 'Not A Slug', summary: 'S' }, admin);
  assert.equal(status, 400);
});

test('deleting a project removes it from the public list', async () => {
  assert.equal((await app.call(`/api/admin/projects/${projectId}`, { method: 'DELETE' }, admin)).status, 204);
  assert.deepEqual((await app.call('/api/projects')).body, []);
});

test('an unknown route is a JSON 404', async () => {
  const { status, body } = await app.call('/api/no-such-route');
  assert.equal(status, 404);
  assert.ok(body.error);
});

test('a new chat session has an empty history', async () => {
  const { status, body } = await app.call('/api/ai-chat/chat/00000000-0000-4000-8000-000000000000');
  assert.equal(status, 200);
  assert.deepEqual(body.messages, []);
});

test('without Stripe configured the API still runs, and checkout answers 503', async () => {
  const { status, body } = await app.post('/api/saas/billing/checkout', {}, customer);
  assert.equal(status, 503);
  assert.doesNotMatch(body.error.message, /STRIPE|key/i, 'no configuration detail reaches the visitor');
});
