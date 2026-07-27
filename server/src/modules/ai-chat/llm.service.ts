import { GoogleGenAI } from '@google/genai';
import { env } from '../../core/config/env.js';
import type { ChatMessage, ChatStreamEvent, RetrievedChunk } from './ai-chat.types.js';

const GEMINI_MODEL = 'gemini-flash-latest';

// Hard ceiling on generation length — protects against runaway cost
// regardless of provider or free-tier status.
const MAX_OUTPUT_TOKENS = 1024;

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

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
function toGeminiContents(history: ChatMessage[]) {
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
function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === 'number') {
      return status === 429 || status >= 500;
    }
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Streams a chat completion grounded in the retrieved RAG context.
 * Yields ChatStreamEvent frames suitable for forwarding directly over
 * SSE to the client. Same external contract as before this file
 * switched providers — ai-chat.service.ts calls this exactly the same
 * way regardless of what's underneath.
 */
export async function* streamChatCompletion(
  history: ChatMessage[],
  retrievedChunks: RetrievedChunk[],
): AsyncGenerator<ChatStreamEvent> {
  const systemInstruction = buildSystemInstruction(retrievedChunks);
  const contents = toGeminiContents(history);
  const retrievedSources = retrievedChunks.map((chunk) => ({
    sourceTitle: chunk.metadata.sourceTitle,
    sourceType: chunk.metadata.sourceType,
  }));

  let attempt = 0;
  let hasYieldedToken = false;

  while (true) {
    try {
      const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      });

      let inputTokens = 0;
      let outputTokens = 0;

      for await (const chunk of stream) {
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

      yield {
        type: 'done',
        usage: { inputTokens, outputTokens },
        retrievedSources,
      };

      return;
    } catch (error) {
      if (!hasYieldedToken && isRetryableError(error) && attempt < MAX_RETRIES) {
        attempt += 1;
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }

      // Logged here for the same reason as before: this error never
      // reaches errorHandler.ts, so without this line it's invisible
      // server-side.
      console.error('streamChatCompletion: unexpected error', error);

      const message =
        error instanceof Error
          ? `Gemini API error: ${error.message}`
          : 'Unexpected error while generating a response';

      yield { type: 'error', message };
      return;
    }
  }
}
