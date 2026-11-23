// Run with `npm test` in server/. The pinned Gemini models and what a
// completion costs: the numbers the daily cost cap adds up.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { costMicroUsd, GEMINI_MODEL_IDS, geminiModel } from './gemini-models.js';

test('the pinned models are stable versions, not -latest aliases', () => {
  assert.deepEqual(GEMINI_MODEL_IDS, ['gemini-3.5-flash-lite', 'gemini-4-hydrogen']);
  for (const id of GEMINI_MODEL_IDS) assert.doesNotMatch(id, /latest|preview|exp/);
});

test('cost: input at the input price, output and thinking at the output price', () => {
  // gemini-4-hydrogen: $1.50 in, $7.50 out per million tokens.
  const hydrogen = geminiModel('gemini-4-hydrogen');
  assert.equal(costMicroUsd(hydrogen, { inputTokens: 1_000_000, outputTokens: 0, thinkingTokens: 0 }), 1_500_000);
  assert.equal(costMicroUsd(hydrogen, { inputTokens: 0, outputTokens: 600, thinkingTokens: 400 }), 7_500);
  // A typical chat turn on gemini-3.5-flash-lite: about a fifth of a cent.
  const lite = geminiModel('gemini-3.5-flash-lite');
  assert.equal(costMicroUsd(lite, { inputTokens: 4_000, outputTokens: 300, thinkingTokens: 0 }), 1_950);
});

test('an unknown model is refused rather than priced at zero', () => {
  assert.throws(() => geminiModel('gemini-flash-latest'), /Unknown Gemini model/);
});
