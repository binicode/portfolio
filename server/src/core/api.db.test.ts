// Run with `npm test` in server/. The API end to end against a real MongoDB
// (in memory): accounts, sessions, roles, the subscription gate, settings,
// the CMS and public reads. The tests share one database and run in order.
// Sign-up and both log-ins share one limit, 10 attempts per 15 minutes per
// address (authLimiter); the tests below use exactly 10, and the last test
// checks that an 11th is refused. A new sign-in test must fit that budget.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN, linkToken, startDatabaseApp, type DatabaseApp } from '../test-support/database-app.js';

let app: DatabaseApp;
let customer: string | undefined;
let admin: string | undefined;
let projectId: string;

before(async () => {
  app = await startDatabaseApp({ ALERT_EMAIL_TO: 'alerts@example.com' });
});

after(async () => {
  await app?.stop();
});

test('health reports the database as connected, and nothing about the environment', async () => {
  const { status, body } = await app.call('/health');
  assert.equal(status, 200);
  assert.equal(body.database, 'connected');
  assert.deepEqual(Object.keys(body).sort(), ['database', 'status', 'timestamp']);
});

test('sign-up creates an account; its confirmation link signs in', async () => {
  const { status, cookie } = await app.post('/api/saas/auth/register', { email: 'Customer@Example.com', password: 'correct-horse-1' });
  assert.equal(status, 202);
  assert.equal(cookie, undefined, 'sign-up itself signs nobody in');
  const email = await app.nextEmail((m) => m.kind === 'verify-email' && m.to === 'customer@example.com');
  const verified = await app.post('/api/saas/auth/verify-email', { token: linkToken(email), password: 'correct-horse-1' });
  assert.equal(verified.status, 200);
  assert.match(verified.cookie ?? '', /^saas_token=/);
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

test('a wrong password and an unknown email get the same refusal', async () => {
  const wrong = await app.post('/api/saas/auth/login', { email: 'customer@example.com', password: 'wrong-password' });
  const unknown = await app.post('/api/saas/auth/login', { email: 'nobody@example.com', password: 'wrong-password' });
  assert.equal(wrong.status, 401);
  assert.deepEqual(unknown, wrong);
});

test('the session returns the account, and no session is refused', async () => {
  const me = await app.call('/api/saas/auth/me', {}, customer);
  assert.equal(me.status, 200);
  assert.equal(me.body.email, 'customer@example.com');
  assert.equal(me.body.emailVerified, true);
  assert.equal(me.body.hasBillingAccount, false);
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

test('admin sign-in refuses a wrong password and an unknown email alike', async () => {
  const wrong = await app.post('/api/admin/auth/login', { email: ADMIN.email, password: 'wrong-password' });
  const unknown = await app.post('/api/admin/auth/login', { email: 'nobody@example.com', password: ADMIN.password });
  assert.equal(wrong.status, 401);
  assert.deepEqual(unknown, wrong);
});

test('a customer token is no admin session, even in the admin cookie', async () => {
  const forged = customer?.replace('saas_token', 'admin_token');
  assert.equal((await app.call('/api/admin/projects', {}, forged)).status, 401);
  assert.equal((await app.call('/api/admin/projects')).status, 401);
  assert.equal((await app.call('/api/admin/auth/me', {}, admin)).body.email, ADMIN.email);
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

test('project links must be http or https', async () => {
  const { status, body } = await app.post('/api/admin/projects', { title: 'X', slug: 'x', summary: 'S', liveUrl: 'javascript:alert(1)' }, admin);
  assert.equal(status, 400);
  assert.deepEqual(body.error.details.liveUrl, ['Use an http or https link.']);
});

test('an invalid slug is refused', async () => {
  const { status } = await app.post('/api/admin/projects', { title: 'X', slug: 'Not A Slug', summary: 'S' }, admin);
  assert.equal(status, 400);
});

test('CMS fields have length limits, with a message per field', async () => {
  const { status, body } = await app.post(
    '/api/admin/projects',
    {
      title: 't'.repeat(121),
      slug: 'too-long',
      summary: 's'.repeat(401),
      techStack: Array.from({ length: 31 }, (_, i) => `tech-${i}`),
      caseStudyBody: 'b'.repeat(50_001),
    },
    admin,
  );
  assert.equal(status, 400);
  assert.deepEqual(body.error.details.title, ['Use at most 120 characters.']);
  assert.deepEqual(body.error.details.summary, ['Use at most 400 characters.']);
  assert.deepEqual(body.error.details.techStack, ['List at most 30 technologies.']);
  assert.deepEqual(body.error.details.caseStudyBody, ['Use at most 50000 characters.']);
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

test('a project brief is stored, and only the admin can read and manage it', async () => {
  const brief = {
    name: 'Ada Client',
    contact: 'ada@example.com',
    brief: '## Project\n- A booking site',
    transcript: [{ q: 'What are you building?', a: ['Web app'] }],
  };
  assert.equal((await app.post('/api/inquiries', brief)).status, 201);
  const alert = await app.nextEmail((m) => m.kind === 'inquiry-alert');
  assert.equal(alert.to, 'alerts@example.com');
  assert.equal(alert.replyTo, 'ada@example.com', 'replying answers the visitor');
  assert.match(alert.text, /A booking site/);
  assert.match(alert.text, /http:\/\/localhost:3000\/dashboard\/inquiries/);

  // A customer's cookie is never read on admin routes: no admin session at all.
  assert.equal((await app.call('/api/admin/inquiries', {}, customer)).status, 401);
  const list = await app.call('/api/admin/inquiries', {}, admin);
  assert.equal(list.status, 200);
  assert.equal(list.body.items.length, 1);
  assert.deepEqual(list.body.items[0].contact, { kind: 'email', value: 'ada@example.com' });
  assert.equal(list.body.stats.unread, 1);

  const id = list.body.items[0]._id;
  const read = await app.patch(`/api/admin/inquiries/${id}`, { read: true }, admin);
  assert.equal(read.status, 200);
  assert.ok(read.body.readAt, 'the updated inquiry comes back marked read');
  assert.equal((await app.call('/api/admin/inquiries/stats', {}, admin)).body.unread, 0);

  assert.equal((await app.call(`/api/admin/inquiries/${id}`, { method: 'DELETE' }, admin)).status, 204);
  assert.equal((await app.call('/api/admin/inquiries/stats', {}, admin)).body.total, 0);
});

test('admin inquiry routes refuse a bad id or body with a 400', async () => {
  assert.equal((await app.patch('/api/admin/inquiries/not-an-id', { read: true }, admin)).status, 400);
  assert.equal((await app.patch('/api/admin/inquiries/507f1f77bcf86cd799439011', { read: 'yes' }, admin)).status, 400);
});

test('a filled honeypot is answered like a real brief but not stored', async () => {
  const sent = app.outbox.length;
  const bot = { name: 'Bot', contact: 'bot@example.com', brief: 'spam', transcript: [{ q: 'Q', a: ['A'] }], website: 'https://spam.example' };
  assert.equal((await app.post('/api/inquiries', bot)).status, 201);
  assert.equal((await app.call('/api/admin/inquiries/stats', {}, admin)).body.total, 0);
  assert.equal(app.outbox.length, sent, 'and no alert is sent');
});

test('without a Gemini key the assistant answers with a plain error event, and keeps the question', async () => {
  const sessionId = '11111111-1111-4111-8111-111111111111';
  const { status, body } = await app.post('/api/ai-chat/chat', { sessionId, message: 'What does Biniyam build?' });
  assert.equal(status, 200);
  assert.match(String(body), /"type":"error"/);
  assert.match(String(body), /can't answer right now/);
  const history = await app.call(`/api/ai-chat/chat/${sessionId}`);
  assert.deepEqual(history.body.messages.map((m: { role: string }) => m.role), ['user']);
});

// These end the sessions the tests above share, so they run last.

test('signing out revokes the customer session, including copies of its token', async () => {
  const copy = customer;
  const out = await app.post('/api/saas/auth/logout', {}, customer);
  assert.equal(out.status, 200);
  assert.match(out.cookie ?? '', /^saas_token=$/, 'the cookie is cleared');
  const me = await app.call('/api/saas/auth/me', {}, copy);
  assert.equal(me.status, 401);
  assert.equal(me.body.error.message, 'Your session has ended. Please sign in again.');

  const again = await app.post('/api/saas/auth/login', { email: 'customer@example.com', password: 'correct-horse-1' });
  assert.equal((await app.call('/api/saas/auth/me', {}, again.cookie)).status, 200, 'signing in again works');
  assert.equal((await app.call('/api/saas/auth/me', {}, copy)).status, 401, 'the old token stays revoked');

  // Signing out with the revoked copy must not end the new session.
  assert.equal((await app.post('/api/saas/auth/logout', {}, copy)).status, 200);
  assert.equal((await app.call('/api/saas/auth/me', {}, again.cookie)).status, 200);
});

test('signing out revokes the admin session, including copies of its token', async () => {
  const copy = admin;
  assert.equal((await app.post('/api/admin/auth/logout', {}, admin)).status, 200);
  assert.equal((await app.call('/api/admin/projects', {}, copy)).status, 401);
  assert.equal((await app.call('/api/admin/auth/me', {}, copy)).status, 401);

  const again = await app.post('/api/admin/auth/login', ADMIN);
  assert.equal((await app.call('/api/admin/projects', {}, again.cookie)).status, 200);
  assert.equal((await app.post('/api/admin/auth/logout', {}, copy)).status, 200);
  assert.equal((await app.call('/api/admin/projects', {}, again.cookie)).status, 200, 'a revoked copy cannot sign the admin out');
});

test('signing out without a session, or with a bad token, still answers 200', async () => {
  assert.equal((await app.post('/api/saas/auth/logout', {})).status, 200);
  assert.equal((await app.post('/api/admin/auth/logout', {}, 'admin_token=not-a-token')).status, 200);
});

test('an 11th sign-in attempt in 15 minutes is refused (brute-force limit)', async () => {
  const { status, body } = await app.post('/api/saas/auth/login', { email: 'customer@example.com', password: 'correct-horse-1' });
  assert.equal(status, 429);
  assert.match(body.error.message, /Too many attempts/);
});
