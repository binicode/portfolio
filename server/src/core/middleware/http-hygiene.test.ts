import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requireDatabase, routeForLog, securityHeaderValues } from './http-hygiene.js';

test('the API sends hardening headers, and HSTS only in production', () => {
  const dev = securityHeaderValues(false);
  assert.equal(dev['X-Content-Type-Options'], 'nosniff');
  assert.match(dev['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(dev['Strict-Transport-Security'], undefined);
  assert.match(securityHeaderValues(true)['Strict-Transport-Security'], /max-age=31536000/);
});

test('logged routes carry no query strings or ids', () => {
  assert.equal(routeForLog('/api/ai-chat/chat/0b5f8a52-3f1e-4c55-9d0e-6a0c2f1b9e77'), '/api/ai-chat/chat/:id');
  assert.equal(routeForLog('/api/admin/projects/65f1c0ffee0123456789abcd?draft=1'), '/api/admin/projects/:id');
  assert.equal(routeForLog('/api/projects/creator-analytics-saas'), '/api/projects/creator-analytics-saas');
  assert.equal(routeForLog('/api/saas/auth/login?email=someone@example.com'), '/api/saas/auth/login');
});

test('routes that need the database answer 503 at once while it is down', () => {
  const run = (ready: boolean) => {
    const sent: { status?: number; headers: Record<string, string>; nextCalled: boolean } = { headers: {}, nextCalled: false };
    const res = {
      setHeader: (name: string, value: string) => (sent.headers[name] = value),
      status(code: number) {
        sent.status = code;
        return { json: () => undefined };
      },
    };
    requireDatabase(() => ready)({} as never, res as never, () => (sent.nextCalled = true));
    return sent;
  };
  assert.deepEqual(run(true), { headers: {}, nextCalled: true });
  const down = run(false);
  assert.equal(down.status, 503);
  assert.equal(down.headers['Retry-After'], '30');
  assert.equal(down.nextCalled, false);
});
