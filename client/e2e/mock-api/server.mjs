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
//   log-in, log-out and session (an in-memory account store; the session
//   cookie is a random id, never a real token).

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.MOCK_API_PORT ?? 4100);
const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'));
const projects = fixture('projects.json');

const SESSION_COOKIE = 'saas_token';
const accounts = new Map(); // email -> { email, password }
const sessions = new Map(); // session id -> email

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
    const email = sessionEmail(req);
    return email
      ? [200, { email, subscriptionStatus: 'none' }]
      : [401, error('Not authenticated')];
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
    if (accounts.has(email)) return send(req, res, 409, error('A record with this value already exists'));
    accounts.set(email, { email, password });
    return send(req, res, 201, { success: true }, signIn(email));
  }

  if (pathname === '/api/saas/auth/login') {
    const body = await readJson(req);
    const account = accounts.get(String(body?.email ?? '').trim().toLowerCase());
    if (!account || account.password !== body?.password) return send(req, res, 401, error('Invalid email or password'));
    return send(req, res, 200, { success: true }, signIn(account.email));
  }

  if (pathname === '/api/saas/auth/logout') {
    return send(req, res, 200, { success: true }, { 'Set-Cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` });
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
