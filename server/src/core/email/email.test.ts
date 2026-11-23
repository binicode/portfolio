// Run with `npm test` in server/. The Resend client without the network: the
// request it builds, when it retries, and that a failed send never throws.
// Each test file runs in its own process, so setting the environment here
// affects only this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:1/unused';
process.env.ADMIN_EMAIL ??= 'admin@example.com';
process.env.ADMIN_PASSWORD_HASH ??= 'unused';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = '';

const { resendRequest, resendTransport, sendEmail, setEmailTransportForTests } = await import('./email.js');
const { inquiryAlert } = await import('./messages.js');

const SENDER = { apiKey: 're_test_key', from: 'Biniyam <hello@mail.example.com>' };
const message = { kind: 'verify-email' as const, to: 'ana@example.com', subject: 'Confirm', text: 'Link: https://example.com/x' };

test('the request: POST /emails, bearer key, idempotency key, plain text only', () => {
  const { url, init } = resendRequest({ ...message, replyTo: 'ada@example.com' }, 'verify/1', SENDER);
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(init.method, 'POST');
  const headers = init.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer re_test_key');
  assert.equal(headers['Idempotency-Key'], 'verify/1');
  assert.deepEqual(JSON.parse(init.body as string), {
    from: 'Biniyam <hello@mail.example.com>',
    to: ['ana@example.com'],
    subject: 'Confirm',
    text: 'Link: https://example.com/x',
    reply_to: ['ada@example.com'],
  });
});

/** A fetch that answers with the given statuses in turn, recording each call. */
function scriptedFetch(...steps: Array<number | Error>) {
  const calls: RequestInit[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    calls.push(init);
    const step = steps[Math.min(calls.length - 1, steps.length - 1)];
    if (step instanceof Error) throw step;
    return new Response(JSON.stringify(step < 300 ? { id: 'email_1' } : { name: 'some_error', message: 'mentions ana@example.com' }), { status: step });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

test('a rate limit, server error or network failure is retried once, with the same idempotency key', async () => {
  for (const first of [429, 503, new TypeError('fetch failed')]) {
    const { calls, fetchImpl } = scriptedFetch(first, 200);
    await resendTransport(SENDER, fetchImpl, 0)(message, 'key-1');
    assert.equal(calls.length, 2);
    assert.deepEqual(
      calls.map((c) => (c.headers as Record<string, string>)['Idempotency-Key']),
      ['key-1', 'key-1'],
    );
  }
});

test('a rejected request (bad sender, unverified domain) is not retried', async () => {
  const { calls, fetchImpl } = scriptedFetch(403, 200);
  await assert.rejects(resendTransport(SENDER, fetchImpl, 0)(message, 'key-2'), /403 some_error/);
  assert.equal(calls.length, 1);
});

test('two failures in a row give up', async () => {
  const { calls, fetchImpl } = scriptedFetch(500, 500);
  await assert.rejects(resendTransport(SENDER, fetchImpl, 0)(message, 'key-3'), /500/);
  assert.equal(calls.length, 2);
});

test('sendEmail reports a failure as false and never throws; without a key email is off', async () => {
  setEmailTransportForTests(async () => {
    throw new Error('boom');
  });
  assert.equal(await sendEmail(message, 'key-4'), false);
  setEmailTransportForTests(async () => {});
  assert.equal(await sendEmail(message, 'key-5'), true);
  setEmailTransportForTests(null);
  assert.equal(await sendEmail(message, 'key-6'), false, 'no RESEND_API_KEY: nothing is sent');
});

test('an enquiry alert replies to the visitor only when they left an email address', () => {
  const base = { to: 'me@example.com', name: 'Ada', brief: '## Project', adminUrl: 'https://example.com/dashboard/inquiries' };
  assert.equal(inquiryAlert({ ...base, contact: { kind: 'email', value: 'ada@example.com' } }).replyTo, 'ada@example.com');
  const linkedin = inquiryAlert({ ...base, contact: { kind: 'linkedin', value: 'https://www.linkedin.com/in/ada' } });
  assert.equal(linkedin.replyTo, undefined);
  assert.match(linkedin.text, /reply on LinkedIn/);
});
