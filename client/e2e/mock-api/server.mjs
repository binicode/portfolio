// Stand-in for the Express API during end-to-end tests.
//
// The real server needs MongoDB Atlas and provider keys, which neither this
// suite nor CI should depend on. This serves the few read-only routes the
// public pages call, with the same response and error shapes as the real API
// (`{ error: { message } }`), from committed fixtures. Plain node:http, no
// dependencies. Playwright starts it before `next build` (see
// playwright.config.ts) so build-time data fetches see the fixtures too.

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const port = Number(process.env.MOCK_API_PORT ?? 4100);
const projects = JSON.parse(readFileSync(new URL('../fixtures/projects.json', import.meta.url), 'utf8'));

function send(req, res, status, body) {
  const origin = req.headers.origin;
  // The browser calls the API cross-origin with credentials, like production.
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  if (body === undefined) {
    res.writeHead(status).end();
    return;
  }
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

const notFound = (message = 'Not found') => [404, { error: { message } }];

/** Returns [status, body] for a GET path. */
function route(path) {
  if (path === '/api/health') return [200, { status: 'ok' }];

  if (path === '/api/projects') return [200, projects.filter((p) => p.published)];

  const project = path.match(/^\/api\/projects\/([^/]+)$/);
  if (project) {
    const slug = decodeURIComponent(project[1]);
    const found = projects.find((p) => p.published && p.slug === slug);
    return found ? [200, found] : notFound('Project not found');
  }

  // A new visitor has no history: the real API answers 200 with an empty thread.
  const history = path.match(/^\/api\/ai-chat\/chat\/([^/]+)$/);
  if (history) return [200, { sessionId: decodeURIComponent(history[1]), messages: [] }];

  // Signed out everywhere.
  if (path === '/api/saas/auth/me' || path === '/api/admin/auth/me') {
    return [401, { error: { message: 'Not authenticated' } }];
  }

  return notFound();
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    send(req, res, 204);
    return;
  }

  if (req.method !== 'GET') {
    // Writes (chat, sign-up, checkout) are out of scope for the smoke suite.
    send(req, res, 501, { error: { message: 'Not implemented in the e2e mock API' } });
    return;
  }

  const [status, body] = route(pathname);
  send(req, res, status, body);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`e2e mock API on http://127.0.0.1:${port}/api`);
});
