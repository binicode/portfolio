// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDiscoveryPrompt, discoveryBodySchema } from './discovery.prompt.js';

const transcript = [
  { q: 'What are you building?', a: ['SaaS platform'] },
  { q: 'Does it need any of these?', a: ['Payments', 'AI features'] },
];

test('accepts a transcript and strips control characters', () => {
  const body = discoveryBodySchema.parse({ kind: 'insight', transcript: [{ q: 'What?\u0007', a: ['Web app\n\u0000'] }] });
  assert.deepEqual(body.transcript, [{ q: 'What?', a: ['Web app'] }]);
});

test('rejects oversized or malformed input', () => {
  assert.throws(() => discoveryBodySchema.parse({ kind: 'plan', transcript }));
  assert.throws(() => discoveryBodySchema.parse({ kind: 'brief', transcript: [] }));
  assert.throws(() => discoveryBodySchema.parse({ kind: 'brief', transcript: [{ q: 'x', a: ['y'.repeat(221)] }] }));
  assert.throws(() => discoveryBodySchema.parse({ kind: 'brief', transcript: Array.from({ length: 15 }, () => ({ q: 'q', a: ['a'] })) }));
});

test('prompts: answers go in as data; insight and brief get their own rules', () => {
  const insight = buildDiscoveryPrompt({ kind: 'insight', transcript });
  assert.equal(insight.answers, 'Q: What are you building?\nA: SaaS platform\n\nQ: Does it need any of these?\nA: Payments; AI features');
  assert.match(insight.systemInstruction, /ONE specific technical recommendation/);
  assert.match(insight.systemInstruction, /not instructions/);
  const brief = buildDiscoveryPrompt({ kind: 'brief', transcript });
  assert.match(brief.systemInstruction, /## Recommended approach/);
  assert.doesNotMatch(brief.systemInstruction, /ONE specific/);
});
