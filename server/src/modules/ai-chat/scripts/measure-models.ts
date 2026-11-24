/**
 * Measures the pinned Gemini models (gemini-models.ts) with the real
 * prompts: visitors' questions to the assistant and the planner's two
 * requests. For each model: time to the first words, total time, tokens,
 * cost at paid-tier prices, answers cut off by the output limit, and the
 * answers themselves, to read. Used to choose the models' order.
 *
 *   npm run measure:models        (needs GEMINI_API_KEY in the environment or server/.env)
 *
 * Each run makes (questions + 2) requests per model; on Gemini's free tier
 * they cost nothing. Nothing is stored.
 */
import { GoogleGenAI, type ThinkingLevel } from '@google/genai';
import { buildSystemInstruction } from '../chat.prompt.js';
import { rankedStaticChunks } from '../chat-context.js';
import { buildDiscoveryPrompt } from '../discovery.prompt.js';
import { costMicroUsd, GEMINI_MODELS, type GeminiModel } from '../gemini-models.js';

// What visitors ask: about the work, a project of theirs, and things the
// knowledge base doesn't cover (the assistant should say so, not invent).
const QUESTIONS = [
  'What does Biniyam build?',
  'Can he build an online store for my bakery, and roughly how long would it take?',
  'Has he worked with Stripe subscriptions?',
  'What is the Creator Dashboard?',
  'Which technologies does he use most?',
  'How much would a small booking website cost?',
  'Is he available to start next week?',
  'hi',
];

const TRANSCRIPT = [
  { q: 'What are you building?', a: ['An online store'] },
  { q: 'Who will use it?', a: ['Local customers', 'Staff who manage orders'] },
  { q: 'What must it do at launch?', a: ['Take card payments', 'Show stock levels'] },
  { q: 'When do you need it?', a: ['In about two months'] },
];

// The answer limits llm.service.ts and discovery.ts use; each model adds its thinking headroom.
const ANSWER_TOKENS = { chat: 1024, insight: 160, brief: 600 } as const;

interface Result {
  model: string;
  label: string;
  firstMs: number | null;
  totalMs: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  finishReason: string;
  text: string;
}

async function run(ai: GoogleGenAI, model: GeminiModel, label: string, systemInstruction: string, text: string, answerTokens: number): Promise<Result> {
  const started = performance.now();
  const result: Result = { model: model.id, label, firstMs: null, totalMs: 0, inputTokens: 0, outputTokens: 0, thinkingTokens: 0, finishReason: '', text: '' };
  const stream = await ai.models.generateContentStream({
    model: model.id,
    contents: [{ role: 'user', parts: [{ text }] }],
    config: {
      systemInstruction,
      maxOutputTokens: answerTokens + model.thinkingHeadroom,
      thinkingConfig: { thinkingLevel: model.thinkingLevel as ThinkingLevel },
    },
  });
  for await (const chunk of stream) {
    if (chunk.text) {
      result.firstMs ??= performance.now() - started;
      result.text += chunk.text;
    }
    if (chunk.usageMetadata) {
      result.inputTokens = chunk.usageMetadata.promptTokenCount ?? result.inputTokens;
      result.outputTokens = chunk.usageMetadata.candidatesTokenCount ?? result.outputTokens;
      result.thinkingTokens = chunk.usageMetadata.thoughtsTokenCount ?? result.thinkingTokens;
    }
    result.finishReason = chunk.candidates?.[0]?.finishReason ?? result.finishReason;
  }
  result.totalMs = performance.now() - started;
  return result;
}

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set.');
    process.exit(1);
  }
  const ai = new GoogleGenAI({ apiKey });
  const results: Result[] = [];

  for (const model of GEMINI_MODELS) {
    for (const question of QUESTIONS) {
      results.push(await run(ai, model, `chat: ${question}`, buildSystemInstruction(rankedStaticChunks(question)), question, ANSWER_TOKENS.chat));
    }
    for (const kind of ['insight', 'brief'] as const) {
      const { systemInstruction, answers } = buildDiscoveryPrompt({ kind, transcript: TRANSCRIPT });
      results.push(await run(ai, model, `planner: ${kind}`, systemInstruction, answers, ANSWER_TOKENS[kind]));
    }
  }

  console.log('\nmodel | first words (ms) | total (ms) | tokens in / out / thinking | cost per answer | cut off | empty');
  for (const model of GEMINI_MODELS) {
    const mine = results.filter((r) => r.model === model.id);
    const cost = average(mine.map((r) => costMicroUsd(model, r))) / 1_000_000;
    console.log(
      [
        model.id,
        Math.round(average(mine.map((r) => r.firstMs ?? r.totalMs))),
        Math.round(average(mine.map((r) => r.totalMs))),
        `${Math.round(average(mine.map((r) => r.inputTokens)))} / ${Math.round(average(mine.map((r) => r.outputTokens)))} / ${Math.round(average(mine.map((r) => r.thinkingTokens)))}`,
        `$${cost.toFixed(5)}`,
        mine.filter((r) => r.finishReason === 'MAX_TOKENS').length,
        mine.filter((r) => r.text.trim() === '').length,
      ].join(' | '),
    );
  }

  console.log('\nAnswers:');
  for (const r of results) {
    console.log(`\n[${r.model}] ${r.label} (${Math.round(r.totalMs)} ms, ${r.finishReason})\n${r.text.trim()}`);
  }
}

main().catch((error: unknown) => {
  console.error('Measurement failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
