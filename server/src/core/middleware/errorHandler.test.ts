// What the error handler answers for errors it didn't raise itself: a body
// Express's parser can't read is the caller's mistake (4xx), anything else
// is a bug (a generic 500 that leaks nothing).
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import { errorHandler } from './errorHandler.js';

let server: Server;
let base: string;

before(async () => {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.post('/echo', (req, res) => {
    res.json({ received: req.body });
  });
  app.post('/broken', () => {
    throw new Error('database password is hunter2');
  });
  app.use(errorHandler);
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

const post = (path: string, body: string) =>
  fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

test('malformed JSON is the caller’s mistake: 400, without echoing the parser’s message', async () => {
  const response = await post('/echo', '{bad');
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: { message: 'The request body isn’t valid JSON.' } });
});

test('a body over the size limit answers 413', async () => {
  const response = await post('/echo', JSON.stringify({ text: 'x'.repeat(2000) }));
  assert.equal(response.status, 413);
  assert.deepEqual(await response.json(), { error: { message: 'The request body is too large.' } });
});

test('a valid body still reaches the route', async () => {
  const response = await post('/echo', '{"a":1}');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { received: { a: 1 } });
});

test('an unexpected error answers a generic 500 that leaks nothing', async () => {
  const response = await post('/broken', '{}');
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { error: { message: 'Internal server error' } });
});
