// Run with `npm test` in server/. Embeddings without the network: the
// request sent to Voyage, and the check that decides whether the Atlas
// vector index needs updating. Each test file runs in its own process, so
// setting the environment here affects only this file.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:1/unused';
process.env.ADMIN_EMAIL ??= 'admin@example.com';
process.env.ADMIN_PASSWORD_HASH ??= 'unused';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.VOYAGE_API_KEY = 'pa-test-key';

const { embedText } = await import('./embedding.service.js');
const { EMBEDDING_DIMENSIONS, KNOWLEDGE_INDEX_DEFINITION, indexDefinitionIsCurrent } = await import('./ai-chat.model.js');

test('a query is embedded with voyage-4-lite at 512 dimensions, as a query', async () => {
  const realFetch = globalThis.fetch;
  let sent: { url: string; body: Record<string, unknown> } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    sent = { url, body: JSON.parse(init.body as string) };
    return new Response(JSON.stringify({ data: [{ index: 0, embedding: new Array(EMBEDDING_DIMENSIONS).fill(0.1) }] }), { status: 200 });
  }) as typeof fetch;
  try {
    const vector = await embedText('  What does Biniyam build?  ', 'query');
    assert.equal(vector.model, 'voyage-4-lite');
    assert.equal(vector.values.length, 512);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(sent!.url, 'https://api.voyageai.com/v1/embeddings');
  assert.deepEqual(sent!.body, {
    model: 'voyage-4-lite',
    input: ['What does Biniyam build?'],
    input_type: 'query',
    output_dimension: 512,
  });
});

test('a vector of the wrong size is refused rather than stored', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ data: [{ index: 0, embedding: new Array(1024).fill(0.1) }] }), { status: 200 })) as unknown as typeof fetch;
  try {
    await assert.rejects(embedText('text', 'document'), /expected 512, received 1024/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('the vector index is updated when it lacks the model filter or has another size', () => {
  assert.ok(indexDefinitionIsCurrent(KNOWLEDGE_INDEX_DEFINITION.fields));
  // Atlas adds defaults of its own to a stored definition: those don't count as a change.
  assert.ok(indexDefinitionIsCurrent(KNOWLEDGE_INDEX_DEFINITION.fields.map((field) => ({ ...field, quantization: 'none' }))));

  const withoutModelFilter = KNOWLEDGE_INDEX_DEFINITION.fields.filter((field) => field.path !== 'embeddingModel');
  assert.equal(indexDefinitionIsCurrent(withoutModelFilter), false);
  const otherSize = KNOWLEDGE_INDEX_DEFINITION.fields.map((field) => (field.type === 'vector' ? { ...field, numDimensions: 1024 } : field));
  assert.equal(indexDefinitionIsCurrent(otherSize), false);
  assert.equal(indexDefinitionIsCurrent(undefined), false);
});
