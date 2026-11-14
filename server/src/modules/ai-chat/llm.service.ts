import { GoogleGenAI } from '@google/genai';
import { env } from '../../core/config/env.js';
import type { ChatMessage, ChatStreamEvent, RetrievedChunk } from './ai-chat.types.js';

// Tried in order. When the primary model is overloaded (Gemini returns
// 503 "high demand") or hangs, the lighter model usually still answers,
// so a visitor gets a reply instead of an error. Both are "-latest"
// aliases that are available to new API keys.
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'] as const;

// Hard ceiling on generation length — protects against runaway cost
// regardless of provider or free-tier status.
const MAX_OUTPUT_TOKENS = 1024;

// One retry per model for transient errors (429/5xx/network), then move
// to the next model.
const RETRIES_PER_MODEL = 1;
const RETRY_BASE_DELAY_MS = 500;

// Without these, an overloaded model can hold the request open until the
// HTTP client's 5-minute headers timeout while the visitor watches a
// spinner. A model that hasn't produced its first chunk in time is
// treated as unavailable and the next one is tried.
const FIRST_CHUNK_TIMEOUT_MS = 10_000;
const TOTAL_TIMEOUT_MS = 60_000;

// What visitors see. Provider error details are logged server-side only.
const BUSY_MESSAGE = 'The assistant is busy right now. Please try again in a minute.';
const INTERRUPTED_MESSAGE = 'The answer was cut off. Please try again.';
const UNAVAILABLE_MESSAGE = "The assistant can't answer right now. Please try again later.";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

function buildSystemInstruction(retrievedChunks: RetrievedChunk[]): string {
  if (retrievedChunks.length === 0) {
    return [
      'You are the AI assistant embedded in this portfolio site.',
      'Answer questions about the portfolio, its projects, and the person behind it.',
      "No relevant context was found in the knowledge base for this question — say so honestly rather than guessing, and suggest the visitor rephrase or browse the projects directly.",
    ].join('\n');
  }

  const contextBlock = retrievedChunks
    .map((chunk, i) => `[${i + 1}] (${chunk.metadata.sourceTitle})\n${chunk.content}`)
    .join('\n\n');

  return [
    'You are the AI assistant embedded in this portfolio site.',
    "Answer the visitor using ONLY the context below. If the context doesn't contain the answer, say you don't have that information rather than inventing it.",
    'Keep answers conversational and concise — this is a chat widget, not a report.',
    '',
    '--- CONTEXT ---',
    contextBlock,
    '--- END CONTEXT ---',
  ].join('\n');
}

/**
 * Gemini uses 'model' for the assistant turn, not 'assistant'. This is
 * the only place that translation happens — ChatMessage stays
 * 'user' | 'assistant' everywhere else in the module (MongoDB,
 * ai-chat.service.ts, the client types), so Gemini's naming convention
 * doesn't leak outside this file.
 */
export function toGeminiContents(history: ChatMessage[]) {
  return history.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }));
}

/**
 * Duck-typed retry check rather than an instanceof check against a
 * specific SDK error class. Confirmed the current package, model
 * names, and streaming API from official docs; could not fully verify
 * this SDK version's exact error class hierarchy, so this checks for a
 * generic numeric `status` field instead of asserting a class name
 * that might not be right.
 */
function errorStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      return status;
    }
  }
  return undefined;
}

function isRetryableError(error: unknown): boolean {
  const status = errorStatus(error);
  if (status !== undefined) {
    return status === 429 || status >= 500;
  }
  // Network-level failures ("fetch failed", connection resets) carry no
  // status but are just as transient.
  return error instanceof TypeError;
}

/** Overloaded (503) or rate-limited (429): retrying the same model right away rarely helps. */
function isCapacityError(error: unknown): boolean {
  const status = errorStatus(error);
  return status === 503 || status === 429;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type TextStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; usage: { inputTokens: number; outputTokens: number } }
  | { type: 'error'; message: string };

/**
 * Streams one Gemini completion with the resilience every assistant feature
 * shares: the models in GEMINI_MODELS tried in order, one retry per model
 * for transient errors, a first-chunk and a total timeout, and visitor-safe
 * error messages (provider details are logged here only). Never switches
 * model mid-answer.
 */
export async function* streamText(
  systemInstruction: string,
  contents: ReturnType<typeof toGeminiContents>,
  maxOutputTokens: number,
  logLabel: string,
): AsyncGenerator<TextStreamEvent> {
  let hasYieldedToken = false;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt <= RETRIES_PER_MODEL; attempt++) {
      const controller = new AbortController();
      let timedOut = false;
      const abortOnTimeout = () => {
        timedOut = true;
        controller.abort();
      };
      const firstChunkTimer = setTimeout(abortOnTimeout, FIRST_CHUNK_TIMEOUT_MS);
      const totalTimer = setTimeout(abortOnTimeout, TOTAL_TIMEOUT_MS);

      try {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            maxOutputTokens,
            abortSignal: controller.signal,
          },
        });

        let inputTokens = 0;
        let outputTokens = 0;

        for await (const chunk of stream) {
          clearTimeout(firstChunkTimer);

          if (chunk.text) {
            hasYieldedToken = true;
            yield { type: 'token', content: chunk.text };
          }

          // The last chunk to include usageMetadata has the final,
          // complete token counts. Defaults to 0 rather than left
          // undefined if the SDK never sends it.
          if (chunk.usageMetadata) {
            inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
            outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
          }
        }

        if (model !== GEMINI_MODELS[0]) {
          console.warn(`${logLabel}: answered with fallback model ${model}`);
        }

        yield { type: 'done', usage: { inputTokens, outputTokens } };
        return;
      } catch (error) {
        // Logged here because this error never reaches errorHandler.ts;
        // without it a failing provider is invisible server-side.
        console.error(
          `${logLabel}: ${model} attempt ${attempt + 1} failed`,
          timedOut ? `(no response within ${FIRST_CHUNK_TIMEOUT_MS / 1000}s)` : error,
        );

        // Once tokens have reached the visitor, switching model would
        // splice two different answers together — stop instead.
        if (hasYieldedToken) {
          yield { type: 'error', message: INTERRUPTED_MESSAGE };
          return;
        }

        if (!timedOut && !isRetryableError(error)) {
          yield { type: 'error', message: UNAVAILABLE_MESSAGE };
          return;
        }

        // A model that hangs or reports it is at capacity is not retried;
        // move straight to the next one.
        if (timedOut || isCapacityError(error)) {
          break;
        }

        if (attempt < RETRIES_PER_MODEL) {
          await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
        }
      } finally {
        clearTimeout(firstChunkTimer);
        clearTimeout(totalTimer);
      }
    }
  }

  yield { type: 'error', message: BUSY_MESSAGE };
}

/**
 * Streams a chat completion grounded in the retrieved RAG context.
 * Yields ChatStreamEvent frames suitable for forwarding directly over
 * SSE to the client. Same external contract as before: the shared
 * streaming loop lives in streamText; this adds the sources to `done`.
 */
export async function* streamChatCompletion(
  history: ChatMessage[],
  retrievedChunks: RetrievedChunk[],
): AsyncGenerator<ChatStreamEvent> {
  const retrievedSources = retrievedChunks.map((chunk) => ({
    sourceTitle: chunk.metadata.sourceTitle,
    sourceType: chunk.metadata.sourceType,
  }));

  for await (const event of streamText(
    buildSystemInstruction(retrievedChunks),
    toGeminiContents(history),
    MAX_OUTPUT_TOKENS,
    'streamChatCompletion',
  )) {
    yield event.type === 'done' ? { ...event, retrievedSources } : event;
  }
}
