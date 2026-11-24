// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  asksAboutWork,
  buildRetrievalQuery,
  publishedProjectsChunk,
  rankedStaticChunks,
  staticKnowledgeChunks,
  withUnseededSources,
} from './chat-context.js';
import { buildSystemInstruction } from './chat.prompt.js';
import { backoffMs, modelsDueForCheck, modelsToTry } from './model-health.js';
import { appendMemoryMessage, clearMemorySessions, getMemorySession, MEMORY_LIMITS } from './session-store.js';
import { knowledgeBaseSources } from './knowledge-base.content.js';
import type { ChatMessage } from './ai-chat.types.js';

const msg = (role: ChatMessage['role'], content: string): ChatMessage => ({ role, content, createdAt: new Date() });

test('a short follow-up is searched together with the previous question', () => {
  const history = [
    msg('user', 'What has Biniyam built with Stripe?'),
    msg('assistant', 'The Creator Dashboard, a subscription SaaS.'),
    msg('user', 'How is it secured?'),
  ];
  assert.equal(buildRetrievalQuery(history), 'What has Biniyam built with Stripe?\nHow is it secured?');
});

test('a full question is searched on its own', () => {
  const long = 'Can you tell me about the AI assistant on this site and how it finds the answers it gives?';
  const history = [msg('user', 'Hi'), msg('assistant', 'Hello!'), msg('user', long)];
  assert.equal(buildRetrievalQuery(history), long);
});

test('the first message is the query, and the query is length-capped', () => {
  assert.equal(buildRetrievalQuery([msg('user', 'Hi')]), 'Hi');
  assert.ok(buildRetrievalQuery([msg('user', 'x'.repeat(5000))]).length <= 600);
});

test('the static knowledge base has one chunk per source, with metadata', () => {
  const chunks = staticKnowledgeChunks();
  assert.equal(chunks.length, knowledgeBaseSources.length);
  for (const chunk of chunks) {
    assert.ok(chunk.content.length > 0);
    assert.ok(chunk.metadata.sourceId && chunk.metadata.sourceTitle);
  }
  // Services and the live products are part of it.
  const ids = chunks.map((chunk) => chunk.metadata.sourceId);
  for (const id of ['services', 'project-creator-dashboard', 'project-assistant']) {
    assert.ok(ids.includes(id), `missing ${id}`);
  }
});

test('entries not yet in the vector store are appended, seeded ones are not', () => {
  const vector = staticKnowledgeChunks().filter((chunk) => chunk.metadata.sourceId === 'bio-main');
  const seeded = new Set(['bio-main', 'certifications', 'personal-trivia', 'technical-stack']);
  const merged = withUnseededSources(vector, seeded);
  const ids = merged.map((chunk) => chunk.metadata.sourceId);
  assert.equal(ids[0], 'bio-main');
  assert.ok(ids.includes('services'));
  assert.ok(!ids.includes('certifications'), 'seeded entries come from vector search only');
  assert.equal(new Set(ids).size, ids.length, 'no duplicates');
});

test('without vector search, matching notes are ranked and scored; a greeting gets everything unscored', () => {
  const stripe = rankedStaticChunks('Which project uses Stripe billing?');
  assert.ok(stripe.slice(0, 2).some((chunk) => chunk.metadata.sourceId === 'project-creator-dashboard'));
  assert.equal(rankedStaticChunks('Tell me about the retrieval-augmented assistant')[0].metadata.sourceId, 'project-assistant');
  assert.ok(stripe.every((chunk) => chunk.score > 0));
  assert.ok(stripe.length <= 6);

  const hello = rankedStaticChunks('Hi there!');
  assert.equal(hello.length, knowledgeBaseSources.length);
  assert.ok(hello.every((chunk) => chunk.score === 0), 'nothing matched, so nothing is presented as a source');
});

test('unseeded entries: only matching ones when vector search found notes, all when it did not', () => {
  const seeded = new Set(['bio-main', 'certifications', 'personal-trivia', 'technical-stack']);
  const onlyMatching = withUnseededSources([], seeded, 'Tell me about the retrieval-augmented assistant', true);
  const ids = onlyMatching.map((chunk) => chunk.metadata.sourceId);
  assert.ok(ids.includes('project-assistant'));
  assert.ok(!ids.includes('project-creator-dashboard'), 'unrelated new entries are left out');
  assert.ok(onlyMatching.every((chunk) => chunk.score > 0));
  const all = withUnseededSources([], seeded, 'Hello', false);
  assert.equal(all.length, knowledgeBaseSources.length - seeded.size);
});

test('questions about the body of work bring in the case studies', () => {
  assert.ok(asksAboutWork('What has he shipped?'));
  assert.ok(asksAboutWork('Show me some projects'));
  assert.ok(!asksAboutWork('Does he play guitar?'));
});

test('a model that is down is not used for visitors until a background check passes', () => {
  const now = 1_000_000;
  assert.deepEqual(modelsToTry(new Map()), ['gemini-3.5-flash-lite', 'gemini-4-hydrogen']);

  // Down, back-off not over: skipped, and not due a check yet.
  const down = new Map([['gemini-3.5-flash-lite', { failures: 1, retryAt: now + 1000 }]]);
  assert.deepEqual(modelsToTry(down), ['gemini-4-hydrogen']);
  assert.deepEqual(modelsDueForCheck(now, down), []);

  // Back-off over: still skipped for visitors, but due a background check.
  const due = new Map([['gemini-3.5-flash-lite', { failures: 1, retryAt: now - 1 }]]);
  assert.deepEqual(modelsToTry(due), ['gemini-4-hydrogen']);
  assert.deepEqual(modelsDueForCheck(now, due), ['gemini-3.5-flash-lite']);

  // Everything down: try them all anyway.
  const allDown = new Map([
    ['gemini-3.5-flash-lite', { failures: 2, retryAt: now + 1000 }],
    ['gemini-4-hydrogen', { failures: 1, retryAt: now + 1000 }],
  ]);
  assert.deepEqual(modelsToTry(allDown), ['gemini-3.5-flash-lite', 'gemini-4-hydrogen']);
});

test('the back-off doubles per failure, from 5 minutes up to an hour', () => {
  assert.equal(backoffMs(1), 5 * 60 * 1000);
  assert.equal(backoffMs(2), 10 * 60 * 1000);
  assert.equal(backoffMs(4), 40 * 60 * 1000);
  assert.equal(backoffMs(10), 60 * 60 * 1000);
});

test('the system prompt carries the rules and the knowledge', () => {
  const prompt = buildSystemInstruction(rankedStaticChunks('Stripe'));
  assert.match(prompt, /Never invent projects, clients/);
  assert.match(prompt, /Plain text only/);
  assert.match(prompt, /--- KNOWLEDGE ---[\s\S]*Creator Dashboard[\s\S]*--- END KNOWLEDGE ---/);
});

test('published case studies become one compact chunk', () => {
  assert.equal(publishedProjectsChunk([]), null);
  const chunk = publishedProjectsChunk([
    { title: 'Creator Analytics SaaS', slug: 'creator-analytics-saas', summary: 'A subscription product.', techStack: ['Next.js', 'Stripe'] },
  ]);
  assert.ok(chunk);
  assert.match(chunk.content, /Creator Analytics SaaS \(case study at \/projects\/creator-analytics-saas\): A subscription product\. Built with Next\.js, Stripe\./);
  assert.equal(chunk.metadata.sourceType, 'case-study');
});

test('the in-memory history keeps the latest messages per session, newest sessions first', () => {
  clearMemorySessions();
  for (let i = 0; i < MEMORY_LIMITS.MAX_MESSAGES_PER_SESSION + 5; i++) appendMemoryMessage('a', msg('user', `m${i}`));
  const a = getMemorySession('a');
  assert.equal(a.length, MEMORY_LIMITS.MAX_MESSAGES_PER_SESSION);
  assert.equal(a.at(-1)?.content, `m${MEMORY_LIMITS.MAX_MESSAGES_PER_SESSION + 4}`);

  for (let i = 0; i < MEMORY_LIMITS.MAX_SESSIONS; i++) appendMemoryMessage(`s${i}`, msg('user', 'hi'));
  assert.deepEqual(getMemorySession('a'), [], 'the oldest session is dropped past the limit');
  assert.equal(getMemorySession(`s${MEMORY_LIMITS.MAX_SESSIONS - 1}`).length, 1);
  clearMemorySessions();
});
