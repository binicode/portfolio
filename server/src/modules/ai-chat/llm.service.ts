import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../core/config/env.js';
import type { ChatMessage, ChatStreamEvent, RetrievedChunk } from './ai-chat.types.js';

const ANTHROPIC_MODEL = 'claude-sonnet-5';

// Hard ceiling on generation length — protects cost on a public-facing
// widget where anyone can send a request.
const MAX_OUTPUT_TOKENS = 1024;

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

const anthropic = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  timeout: REQUEST_TIMEOUT_MS,
});

function buildSystemPrompt(retrievedChunks: RetrievedChunk[]): string {
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

function toAnthropicMessages(history: ChatMessage[]) {
  return history.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Anthropic.APIError && typeof error.status === 'number') {
    // 429 rate limit, 529 overloaded, and 5xx are transient.
    return error.status === 429 || error.status === 529 || error.status >= 500;
  }
  return false;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Streams a chat completion grounded in the retrieved RAG context.
 * Yields ChatStreamEvent frames suitable for forwarding directly over
 * SSE to the client. This function has no knowledge of Express/HTTP —
 * that boundary belongs to ai-chat.controller.ts.
 *
 * Transient failures (rate limit / overload / 5xx) are retried with
 * exponential backoff, but ONLY before any token has reached the
 * caller. Once streaming has started, a failure surfaces as an 'error'
 * event instead, since partial output can't be un-sent.
 */
export async function* streamChatCompletion(
  history: ChatMessage[],
  retrievedChunks: RetrievedChunk[],
): AsyncGenerator<ChatStreamEvent> {
  const system = buildSystemPrompt(retrievedChunks);
  const messages = toAnthropicMessages(history);
  const retrievedSources = retrievedChunks.map((chunk) => ({
    sourceTitle: chunk.metadata.sourceTitle,
    sourceType: chunk.metadata.sourceType,
  }));

  let attempt = 0;
  let hasYieldedToken = false;

  while (true) {
    try {
      const stream = anthropic.messages.stream({
        model: ANTHROPIC_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          hasYieldedToken = true;
          yield { type: 'token', content: event.delta.text };
        }
      }

      const finalMessage = await stream.finalMessage();

      yield {
        type: 'done',
        usage: {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
        },
        retrievedSources,
      };

      return;
    } catch (error) {
      if (!hasYieldedToken && isRetryableError(error) && attempt < MAX_RETRIES) {
        attempt += 1;
        await delay(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
        continue;
      }

      const message =
        error instanceof Anthropic.APIError
          ? `Anthropic API error: ${error.message}`
          : 'Unexpected error while generating a response';

      yield { type: 'error', message };
      return;
    }
  }
}