// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NAME_MAX, contactKind, sendResult, validateInquiry } from './inquiry.ts';

test('a reply address is an email or a LinkedIn profile link', () => {
  assert.equal(contactKind('ada@example.com'), 'email');
  assert.equal(contactKind('  ada@example.co.uk '), 'email');
  for (const link of [
    'https://www.linkedin.com/in/ada-lovelace',
    'linkedin.com/in/ada-lovelace/',
    'uk.linkedin.com/in/ada-lovelace?utm_source=share',
  ]) {
    assert.equal(contactKind(link), 'linkedin', link);
  }
  for (const value of ['', 'ada', 'ada@example', '+1 555 0100', 'https://www.linkedin.com/company/acme', 'https://example.com/in/ada']) {
    assert.equal(contactKind(value), null, value);
  }
});

test('the form asks for a name and a way to reply', () => {
  assert.deepEqual(validateInquiry({ name: 'Ada', contact: 'ada@example.com' }), {});
  assert.deepEqual(validateInquiry({ name: '  ', contact: '' }), {
    name: 'Add your name.',
    contact: 'Add an email address or a LinkedIn profile link.',
  });
  assert.deepEqual(validateInquiry({ name: 'a'.repeat(NAME_MAX + 1), contact: 'ada' }), {
    name: `Use ${NAME_MAX} characters or fewer.`,
    contact: 'Enter an email address or a LinkedIn profile link.',
  });
});

test('responses become the next state of the form', () => {
  assert.deepEqual(sendResult(201, { ok: true }), { status: 'sent' });
  assert.deepEqual(sendResult(429, null), { status: 'limited' });
  assert.deepEqual(sendResult(500, { error: { message: 'Internal server error' } }), { status: 'failed' });
  assert.deepEqual(sendResult(0, null), { status: 'failed' });
  assert.deepEqual(
    sendResult(400, { error: { message: 'Validation failed', details: { contact: ['Enter an email address or a LinkedIn profile link.'] } } }),
    { status: 'invalid', errors: { contact: 'Enter an email address or a LinkedIn profile link.' } },
  );
});

test('a rejected brief is not the visitor’s to fix, so it falls back', () => {
  assert.deepEqual(sendResult(400, { error: { message: 'Validation failed', details: { brief: ['Too long'] } } }), { status: 'failed' });
  assert.deepEqual(sendResult(400, 'not json'), { status: 'failed' });
});
