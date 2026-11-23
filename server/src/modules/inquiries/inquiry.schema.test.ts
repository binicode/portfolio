// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BRIEF_MAX, NAME_MAX, cleanMultiline, inquiryBodySchema, isHoneypotFilled, parseContact } from './inquiry.schema.js';
import { z } from 'zod';

const valid = {
  name: 'Ada Lovelace',
  contact: 'ada@example.com',
  brief: '## Project\n- An online store for prints.\n## First release\n- Catalogue and checkout.',
  transcript: [
    { q: 'What are you building?', a: ['Online store'] },
    { q: 'Does it need any of these?', a: ['Payments'] },
  ],
};

const fieldErrors = (body: unknown) => {
  const result = inquiryBodySchema.safeParse(body);
  assert.equal(result.success, false);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
};

test('accepts a brief with an email address', () => {
  const body = inquiryBodySchema.parse(valid);
  assert.equal(body.name, 'Ada Lovelace');
  assert.deepEqual(body.contact, { kind: 'email', value: 'ada@example.com' });
  assert.equal(body.brief, valid.brief);
  assert.deepEqual(body.transcript, valid.transcript);
});

test('LinkedIn profile links are rebuilt on linkedin.com from the handle', () => {
  for (const link of [
    'https://www.linkedin.com/in/ada-lovelace',
    'http://linkedin.com/in/ada-lovelace/',
    'linkedin.com/in/ada-lovelace',
    'www.linkedin.com/in/ada-lovelace?utm_source=share',
    'https://uk.linkedin.com/in/ada-lovelace',
  ]) {
    assert.deepEqual(parseContact(link), { kind: 'linkedin', value: 'https://www.linkedin.com/in/ada-lovelace' }, link);
  }
  assert.deepEqual(parseContact('linkedin.com/in/zoë-ab'), { kind: 'linkedin', value: 'https://www.linkedin.com/in/zoë-ab' });
});

test('anything that is not an email or a LinkedIn profile is refused', () => {
  for (const contact of [
    '',
    '   ',
    'ada',
    '+1 555 0100',
    'https://example.com/in/ada',
    'https://linkedin.com.evil.test/in/ada',
    'https://www.linkedin.com/company/acme',
    'https://www.linkedin.com/in/',
    'javascript:alert(1)//linkedin.com/in/ada',
    'https://www.linkedin.com/in/ada"><script>',
  ]) {
    assert.equal(parseContact(contact), null, contact);
  }
  assert.deepEqual(fieldErrors({ ...valid, contact: 'ada' }).contact, ['Enter an email address or a LinkedIn profile link.']);
});

test('name is required, cleaned of control characters and length-limited', () => {
  assert.equal(inquiryBodySchema.parse({ ...valid, name: '  Ada\u0000\n Lovelace\u007f ' }).name, 'Ada Lovelace');
  assert.deepEqual(fieldErrors({ ...valid, name: ' \n ' }).name, ['Add your name.']);
  assert.deepEqual(fieldErrors({ ...valid, name: undefined }).name, ['Add your name.']);
  assert.ok(inquiryBodySchema.safeParse({ ...valid, name: 'a'.repeat(NAME_MAX) }).success);
  assert.ok(fieldErrors({ ...valid, name: 'a'.repeat(NAME_MAX + 1) }).name);
});

test('the brief keeps its lines but loses other control characters', () => {
  assert.equal(cleanMultiline('## Project\r\n- One\u0007 two\t\r\n\r\n\r\n\r\n- Three   \n'), '## Project\n- One  two\n\n- Three');
  assert.ok(fieldErrors({ ...valid, brief: '\n\n ' }).brief);
  assert.ok(fieldErrors({ ...valid, brief: 'x'.repeat(BRIEF_MAX + 1) }).brief);
});

test('the transcript has the discovery limits', () => {
  assert.ok(fieldErrors({ ...valid, transcript: [] }).transcript);
  assert.ok(fieldErrors({ ...valid, transcript: Array.from({ length: 15 }, () => valid.transcript[0]) }).transcript);
  assert.ok(fieldErrors({ ...valid, transcript: [{ q: 'x'.repeat(161), a: ['a'] }] }).transcript);
});

test('unknown fields, the honeypot included, are not stored', () => {
  const body = inquiryBodySchema.parse({ ...valid, website: '', admin: true });
  assert.deepEqual(Object.keys(body).sort(), ['brief', 'contact', 'name', 'transcript']);
});

test('the honeypot counts only when something is in it', () => {
  assert.equal(isHoneypotFilled({ ...valid }), false);
  assert.equal(isHoneypotFilled({ ...valid, website: '' }), false);
  assert.equal(isHoneypotFilled({ ...valid, website: '   ' }), false);
  assert.equal(isHoneypotFilled({ ...valid, website: 'https://spam.test' }), true);
  assert.equal(isHoneypotFilled({ ...valid, website: 1 }), true);
  assert.equal(isHoneypotFilled(null), false);
  assert.equal(isHoneypotFilled('website'), false);
});
