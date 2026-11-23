import { expect, test } from './support/fixtures';
import { adminTokenVersion } from './support/db';
import { signToken, stripeSignature } from './support/jwt';
import { QA } from './settings';

/**
 * Authorization and input boundaries of the real API, called directly (no
 * browser): what a signed-out caller, a forged or expired token, a SaaS user
 * and the admin can each reach. Device-independent, so desktop only.
 *
 * Login attempts count against the API's auth limiter (10 per 15 minutes per
 * IP, shared by admin and SaaS); this file uses two.
 */

// Tablet and phone profiles are both mobile: this runs on desktop only.
test.skip(({ isMobile }) => isMobile, 'API checks run once, on desktop');

const api = (path: string) => `${QA.apiURL}${path}`;
const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const saasUser = () => signToken({ sub: '64b000000000000000000001', role: 'user', email: 'qa.user@example.com' }, { kind: 'customer' });
const admin = async () => signToken({ sub: 'admin', role: 'admin', email: QA.admin.email, ver: await adminTokenVersion() });

const protectedRoutes = [
  ['GET', '/saas/auth/me'],
  ['GET', '/saas/aggregator'],
  ['PATCH', '/saas/settings'],
  ['POST', '/saas/billing/checkout'],
  ['GET', '/admin/auth/me'],
  ['GET', '/admin/projects'],
  ['POST', '/admin/projects'],
  ['GET', '/admin/projects/64b000000000000000000001'],
  ['PATCH', '/admin/projects/64b000000000000000000001'],
  ['DELETE', '/admin/projects/64b000000000000000000001'],
] as const;

test('signed out: every protected endpoint answers 401', async ({ request, diag }) => {
  const results: string[] = [];
  for (const [method, path] of protectedRoutes) {
    const response = await request.fetch(api(path), { method, data: method === 'GET' || method === 'DELETE' ? undefined : {} });
    results.push(`${method} ${path} → ${response.status()}`);
    expect.soft(response.status(), `${method} ${path}`).toBe(401);
    expect.soft((await response.json()).error?.message).toBe('Authentication required');
  }
  diag.note('results', results);
});

test('forged, unsigned and expired tokens are rejected with 401', async ({ request, diag }) => {
  const cases = {
    'wrong secret': signToken({ sub: 'admin', role: 'admin' }, { secret: 'not-the-servers-secret-0000000000000000' }),
    'alg none': signToken({ sub: 'admin', role: 'admin' }, { alg: 'none' }),
    expired: signToken({ sub: 'admin', role: 'admin' }, { expiresInSeconds: -60 }),
    garbage: 'not.a.jwt',
  };
  const results: Record<string, string> = {};
  for (const [name, token] of Object.entries(cases)) {
    const response = await request.get(api('/admin/projects'), { headers: bearer(token) });
    const message = (await response.json()).error?.message;
    results[name] = `${response.status()} ${message}`;
    expect.soft(response.status(), name).toBe(401);
  }
  diag.note('results', results);
  expect(results.expired).toContain('Token has expired');
});

// Each kind of token names its audience: a customer token is no admin
// session and the admin's is no customer session, so both get a 401.
test('role boundaries: a SaaS user cannot reach admin routes, the admin cannot reach SaaS routes', async ({ request, diag }) => {
  const adminToken = await admin();
  const results: string[] = [];
  for (const path of ['/admin/projects', '/admin/auth/me']) {
    const response = await request.get(api(path), { headers: bearer(saasUser()) });
    results.push(`user → GET ${path} → ${response.status()}`);
    expect.soft(response.status(), `user → ${path}`).toBe(401);
  }
  const create = await request.post(api('/admin/projects'), { headers: bearer(saasUser()), data: { title: 'x' } });
  results.push(`user → POST /admin/projects → ${create.status()}`);
  expect.soft(create.status()).toBe(401);

  for (const [method, path] of [
    ['GET', '/saas/auth/me'],
    ['GET', '/saas/aggregator'],
    ['PATCH', '/saas/settings'],
    ['POST', '/saas/billing/checkout'],
  ] as const) {
    const response = await request.fetch(api(path), { method, headers: bearer(adminToken), data: method === 'GET' ? undefined : {} });
    results.push(`admin → ${method} ${path} → ${response.status()}`);
    expect.soft(response.status(), `admin → ${path}`).toBe(401);
  }
  diag.note('results', results);
});

test('cookies are scoped: the admin cookie does not authenticate SaaS routes and vice versa', async ({ playwright, diag }) => {
  const context = await playwright.request.newContext({
    extraHTTPHeaders: { Cookie: `admin_token=${await admin()}` },
  });
  const saasWithAdminCookie = await context.get(api('/saas/auth/me'));
  const adminWithAdminCookie = await context.get(api('/admin/auth/me'));
  await context.dispose();

  const context2 = await playwright.request.newContext({
    extraHTTPHeaders: { Cookie: `saas_token=${saasUser()}` },
  });
  const adminWithSaasCookie = await context2.get(api('/admin/auth/me'));
  await context2.dispose();

  diag.note('results', {
    'admin_token → /saas/auth/me': saasWithAdminCookie.status(),
    'admin_token → /admin/auth/me': adminWithAdminCookie.status(),
    'saas_token → /admin/auth/me': adminWithSaasCookie.status(),
  });
  expect(saasWithAdminCookie.status()).toBe(401);
  expect(adminWithAdminCookie.status()).toBe(200);
  expect(adminWithSaasCookie.status()).toBe(401);
});

test('admin login: wrong password 401, right password sets an httpOnly strict cookie and no token in the body', async ({ playwright, diag }) => {
  const context = await playwright.request.newContext();
  const wrong = await context.post(api('/admin/auth/login'), { data: { email: QA.admin.email, password: 'definitely-wrong' } });
  expect(wrong.status()).toBe(401);
  expect((await wrong.json()).error.message).toBe('Invalid email or password');

  const right = await context.post(api('/admin/auth/login'), { data: { email: QA.admin.email, password: QA.admin.password } });
  expect(right.status()).toBe(200);
  const body = await right.text();
  const setCookie = right.headers()['set-cookie'] ?? '';
  diag.note('loginBody', body);
  diag.note('setCookieFlags', setCookie.replace(/admin_token=[^;]+/, 'admin_token=<redacted>'));
  expect(body).toBe('{"success":true}');
  expect(setCookie).toMatch(/admin_token=/);
  expect(setCookie).toMatch(/HttpOnly/i);
  expect(setCookie).toMatch(/SameSite=Strict/i);
  diag.note('rateLimitRemainingAfterLogin', right.headers()['ratelimit-remaining'] ?? right.headers()['ratelimit'] ?? null);

  const me = await context.get(api('/admin/auth/me'));
  expect(me.status()).toBe(200);
  expect(await me.json()).toEqual({ email: QA.admin.email });

  const logout = await context.post(api('/admin/auth/logout'));
  expect(logout.status()).toBe(200);
  const after = await context.get(api('/admin/auth/me'));
  expect(after.status()).toBe(401);
  await context.dispose();
});

test('input validation: bad bodies get 400 with field errors, never a 500', async ({ request, diag }) => {
  const cases: Array<[string, string, unknown]> = [
    ['chat: empty message', '/ai-chat/chat', { sessionId: 'qa-session', message: '' }],
    ['chat: no session id', '/ai-chat/chat', { message: 'hello' }],
    ['chat: message too long', '/ai-chat/chat', { sessionId: 'qa-session', message: 'x'.repeat(20_000) }],
    ['discovery: unknown kind', '/ai-chat/discovery', { kind: 'essay', transcript: [] }],
    ['discovery: transcript not a list', '/ai-chat/discovery', { kind: 'brief', transcript: 'all of it' }],
    ['admin login: not an email', '/admin/auth/login', { email: 'nope', password: 'x' }],
  ];
  const results: Record<string, string> = {};
  for (const [name, path, data] of cases) {
    const response = await request.post(api(path), { data });
    const text = await response.text();
    results[name] = `${response.status()} ${text.slice(0, 160)}`;
    expect.soft(response.status(), name).toBeGreaterThanOrEqual(400);
    expect.soft(response.status(), name).toBeLessThan(500);
  }
  diag.note('results', results);
});

test('Stripe webhook: missing or wrong signature is rejected', async ({ request, diag }) => {
  const payload = JSON.stringify({ id: 'evt_qa', type: 'customer.subscription.updated', data: { object: {} } });
  const missing = await request.post(api('/saas/billing/webhook'), { headers: { 'Content-Type': 'application/json' }, data: payload });
  const wrong = await request.post(api('/saas/billing/webhook'), {
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': stripeSignature(payload, 'whsec_someone_elses_secret') },
    data: payload,
  });
  const stale = await request.post(api('/saas/billing/webhook'), {
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': stripeSignature(payload, undefined, Math.floor(Date.now() / 1000) - 3600) },
    data: payload,
  });
  diag.note('results', { missing: missing.status(), wrongSecret: wrong.status(), replayedOneHourLater: stale.status() });
  expect(missing.status()).toBe(400);
  expect(wrong.status()).toBe(400);
  expect(stale.status()).toBe(400);
});

test('CORS allows only the client origin, with credentials', async ({ request, diag }) => {
  const ok = await request.get(api('/projects'), { headers: { Origin: QA.baseURL } });
  const evil = await request.get(api('/projects'), { headers: { Origin: 'https://evil.example' } });
  const result = {
    clientOrigin: ok.headers()['access-control-allow-origin'],
    clientCredentials: ok.headers()['access-control-allow-credentials'],
    otherOrigin: evil.headers()['access-control-allow-origin'] ?? null,
  };
  diag.note('results', result);
  expect(result.clientOrigin).toBe(QA.baseURL);
  expect(result.clientCredentials).toBe('true');
  expect(result.otherOrigin === null || result.otherOrigin === QA.baseURL).toBe(true);
});

test('unknown API routes answer a JSON 404', async ({ request }) => {
  const response = await request.get(api('/qa-no-such-route'));
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toContain('application/json');
});
