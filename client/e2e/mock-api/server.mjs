// A stand-in for the Express API during end-to-end tests.
//
// The real server needs MongoDB and provider keys, which this suite and CI
// should not depend on. This serves what the pages and journeys call, with
// the same response and error shapes as the real API, from committed
// fixtures. Plain node:http, no dependencies. Playwright starts it before `next build` (see
// playwright.config.ts) so build-time data fetches see the fixtures too.
//
// - API (HTTP, MOCK_API_PORT, default 4100): projects, chat history and
//   answers, the planner's insight and brief, and Creator Dashboard sign-up,
//   email confirmation, log-in, log-out, password reset, account deletion and
//   session (an in-memory account store; the session cookie is a random id,
//   never a real token).
// - GET /__test/last-link?email=...&kind=verify|reset: the token the real API
//   would have emailed. Test-only; the real API has nothing like it.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';

const port = Number(process.env.MOCK_API_PORT ?? 4100);
const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
const projects = fixture('projects.json');

const SESSION_COOKIE = 'saas_token';
const accounts = new Map(); // email -> { email, password, verified }
const sessions = new Map(); // session id -> email
const links = new Map(); // token -> { email, kind: 'verify' | 'reset' }

function issueLink(email, kind) {
  const token = randomBytes(32).toString('base64url');
  links.set(token, { email, kind });
  return token;
}

function redeemLink(token, kind) {
  const link = links.get(String(token ?? ''));
  if (!link || link.kind !== kind || !accounts.has(link.email)) return null;
  links.delete(token);
  return accounts.get(link.email);
}

const LINK_INVALID = 'This link has expired or was already used.';
const LOGIN_REFUSED = 'Invalid email or password. Just signed up? Confirm your email first.';
const CLEAR_COOKIE = { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` };

function cors(req, res) {
  const origin = req.headers.origin;
  // The browser calls the API cross-origin with credentials, like production.
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
}

function send(req, res, status, body, headers = {}) {
  cors(req, res);
  if (body === undefined) {
    res.writeHead(status, headers).end();
    return;
  }
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers }).end(JSON.stringify(body));
}

/** Server-Sent Events, framed like the real API: `data: {...}\n\n`. */
function stream(req, res, events) {
  cors(req, res);
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
  for (const event of events) res.write(`data: ${JSON.stringify(event)}\n\n`);
  res.end();
}

const tokens = (text) => text.split(/(?<= )/).map((content) => ({ type: 'token', content }));
const error = (message) => ({ error: { message } });
const notFound = (message = 'Not found') => [404, error(message)];

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return null;
  }
}

function sessionEmail(req) {
  const cookie = req.headers.cookie ?? '';
  const id = cookie
    .split(';')
    .map((part) => part.trim().split('='))
    .find(([name]) => name === SESSION_COOKIE)?.[1];
  return id ? sessions.get(id) : undefined;
}

function signIn(email) {
  const id = randomUUID();
  sessions.set(id, email);
  // Same attributes as the real API in development (secure only in production).
  return { 'Set-Cookie': `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800` };
}

/** Returns [status, body] for a GET path. */
function get(req, pathname) {
  if (pathname === '/api/health') return [200, { status: 'ok', database: 'connected' }];

  if (pathname === '/api/projects') return [200, projects.filter((p) => p.published)];

  const project = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (project) {
    const slug = decodeURIComponent(project[1]);
    const found = projects.find((p) => p.published && p.slug === slug);
    return found ? [200, found] : notFound('Project not found');
  }

  // A new visitor has no history: the real API answers 200 with an empty thread.
  const history = pathname.match(/^\/api\/ai-chat\/chat\/([^/]+)$/);
  if (history) return [200, { sessionId: decodeURIComponent(history[1]), messages: [] }];

  if (pathname === '/api/saas/auth/me') {
    const account = accounts.get(sessionEmail(req));
    return account
      ? [200, { email: account.email, emailVerified: account.verified, subscriptionStatus: 'none', hasBillingAccount: false }]
      : [401, error('Not authenticated')];
  }

  if (pathname === '/__test/last-link') {
    const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
    const found = [...links].reverse().find(([, link]) => link.email === params.get('email') && link.kind === params.get('kind'));
    return found ? [200, { token: found[0] }] : notFound('No link');
  }

  if (pathname === '/api/admin/auth/me') return [401, error('Not authenticated')];

  return notFound();
}

async function post(req, res, pathname) {
  if (pathname === '/api/saas/auth/register') {
    const body = await readJson(req);
    const email = String(body?.email ?? '').trim().toLowerCase();
    const password = String(body?.password ?? '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 8) {
      return send(req, res, 400, { error: { message: 'Validation failed', details: {} } });
    }
    // Like the real API: the same answer whether or not the address has an
    // account; signing up again while unconfirmed replaces the password and
    // sends a new link.
    const existing = accounts.get(email);
    if (!existing) {
      accounts.set(email, { email, password, verified: false });
      issueLink(email, 'verify');
    } else if (!existing.verified) {
      existing.password = password;
      issueLink(email, 'verify');
    }
    return send(req, res, 202, { ok: true });
  }

  if (pathname === '/api/saas/auth/verify-email') {
    // Like the real API: the link and the sign-up password together.
    const body = await readJson(req);
    const link = links.get(String(body?.token ?? ''));
    const pending = link?.kind === 'verify' ? accounts.get(link.email) : undefined;
    if (!pending) return send(req, res, 400, error(LINK_INVALID));
    if (pending.password !== body?.password) return send(req, res, 401, error('That password doesn’t match the one chosen at sign-up.'));
    const account = redeemLink(body.token, 'verify');
    account.verified = true;
    return send(req, res, 200, { success: true }, signIn(account.email));
  }

  if (pathname === '/api/saas/auth/password/forgot') {
    const email = String((await readJson(req))?.email ?? '').trim().toLowerCase();
    if (accounts.has(email)) issueLink(email, 'reset');
    return send(req, res, 202, { ok: true });
  }

  if (pathname === '/api/saas/auth/password/reset') {
    const body = await readJson(req);
    if (String(body?.password ?? '').length < 8) return send(req, res, 400, { error: { message: 'Validation failed', details: {} } });
    const account = redeemLink(body?.token, 'reset');
    if (!account) return send(req, res, 400, error(LINK_INVALID));
    account.password = body.password;
    account.verified = true;
    for (const [id, email] of sessions) if (email === account.email) sessions.delete(id);
    return send(req, res, 200, { success: true }, signIn(account.email));
  }

  if (pathname === '/api/saas/auth/login') {
    const body = await readJson(req);
    const account = accounts.get(String(body?.email ?? '').trim().toLowerCase());
    if (!account || account.password !== body?.password || !account.verified) return send(req, res, 401, error(LOGIN_REFUSED));
    return send(req, res, 200, { success: true }, signIn(account.email));
  }

  if (pathname === '/api/saas/auth/logout') {
    return send(req, res, 200, { success: true }, CLEAR_COOKIE);
  }

  if (pathname === '/api/ai-chat/chat') {
    return stream(req, res, [
      ...tokens('Fixture answer: two live products run on this site.'),
      { type: 'done', usage: { inputTokens: 1, outputTokens: 1 }, retrievedSources: [{ sourceTitle: 'Fixture notes', sourceType: 'bio' }] },
    ]);
  }

  if (pathname === '/api/ai-chat/discovery') {
    const body = await readJson(req);
    const text =
      body?.kind === 'brief'
        ? '## Fixture brief\nA test project from the end-to-end suite.\n## Must have\n- Sign-up\n- Payments'
        : 'Fixture insight for the end-to-end suite.';
    return stream(req, res, [...tokens(text), { type: 'done' }]);
  }

  // Checkout, settings and admin writes are out of scope for this suite.
  return send(req, res, 501, error('Not implemented in the e2e mock API'));
}

const api = createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    send(req, res, 204);
    return;
  }

  if (req.method === 'POST') {
    await post(req, res, pathname);
    return;
  }

  if (req.method === 'DELETE' && pathname === '/api/saas/account') {
    const account = accounts.get(sessionEmail(req));
    if (!account) return send(req, res, 401, error('Authentication required'));
    if ((await readJson(req))?.password !== account.password) return send(req, res, 403, error('That password is not right.'));
    accounts.delete(account.email);
    for (const [id, email] of sessions) if (email === account.email) sessions.delete(id);
    return send(req, res, 200, { success: true }, CLEAR_COOKIE);
  }

  if (req.method !== 'GET') {
    send(req, res, 501, error('Not implemented in the e2e mock API'));
    return;
  }

  const [status, body] = get(req, pathname);
  send(req, res, status, body);
});

// No host: listens on every interface, so both localhost (the browser and
// the Next server) and 127.0.0.1 reach it.
api.listen(port, () => {
  console.log(`e2e mock API on http://localhost:${port}/api`);
});
