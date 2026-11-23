// Run with `npm test` in server/ (Node's test runner through tsx).
// HTTP checks that never reach the database: the admin guard's token
// checks, validation before any query, and the honeypot. (An admin token
// also needs the database, for its version: api.db.test.ts.) Each test file runs in its own
// process, so setting the environment here affects only this file.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:1/unused';
process.env.ADMIN_EMAIL ??= 'admin@example.com';
process.env.ADMIN_PASSWORD_HASH ??= 'unused';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const express = (await import('express')).default;
const mongoose = (await import('mongoose')).default;
const { errorHandler } = await import('../../core/middleware/errorHandler.js');
const { signAccessToken } = await import('../../core/middleware/auth.js');
const inquiriesRouter = (await import('./inquiries.routes.js')).default;
const adminRouter = (await import('../admin/admin.routes.js')).default;

// A query that slipped past validation fails at once instead of waiting
// for a connection that never comes.
mongoose.set('bufferCommands', false);

let server: Server;
let base: string;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/inquiries', inquiriesRouter);
  app.use('/api/admin', adminRouter);
  app.use(errorHandler);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(() => server.close());

const customerBearer = { Authorization: `Bearer ${signAccessToken('customer', { sub: '507f1f77bcf86cd799439011', ver: 0 })}` };

const request = (path: string, init: RequestInit = {}) =>
  fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });

test('admin inquiry routes refuse visitors without a token', async () => {
  for (const [method, path] of [
    ['GET', '/admin/inquiries'],
    ['GET', '/admin/inquiries/stats'],
    ['PATCH', '/admin/inquiries/507f1f77bcf86cd799439011'],
    ['DELETE', '/admin/inquiries/507f1f77bcf86cd799439011'],
  ]) {
    const response = await request(path, { method, body: method === 'PATCH' ? '{"read":true}' : undefined });
    assert.equal(response.status, 401, `${method} ${path}`);
  }
});

test('admin inquiry routes refuse a signed-in SaaS customer: no admin session', async () => {
  const response = await request('/admin/inquiries', { headers: customerBearer });
  assert.equal(response.status, 401);
});

test('an invalid inquiry gets field messages, nothing internal', async () => {
  const response = await request('/inquiries', { method: 'POST', body: JSON.stringify({ name: '', contact: 'nope', brief: 'x' }) });
  assert.equal(response.status, 400);
  const body = (await response.json()) as { error: { message: string; details: Record<string, string[]> } };
  assert.equal(body.error.message, 'Validation failed');
  assert.deepEqual(body.error.details.name, ['Add your name.']);
  assert.deepEqual(body.error.details.contact, ['Enter an email address or a LinkedIn profile link.']);
  assert.ok(body.error.details.transcript);
});

test('with the database down, a valid brief gets a quick 503', async () => {
  const response = await request('/inquiries', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Ada Lovelace',
      contact: 'ada@example.com',
      brief: '## Project\n- An online store.',
      transcript: [{ q: 'What are you building?', a: ['Online store'] }],
    }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: { message: 'Briefs can’t be received right now.' } });
});

test('a filled honeypot looks sent and is never stored', async () => {
  // bufferCommands is off and nothing is connected: a database write would fail with a 500.
  const response = await request('/inquiries', { method: 'POST', body: JSON.stringify({ website: 'https://spam.test', name: 'Bot' }) });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
});
