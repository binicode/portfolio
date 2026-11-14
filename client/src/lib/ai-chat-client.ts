import { apiClient } from './api-client';
import { clientEnv } from './config';
import type { ChatHistoryResponse, ChatStreamEvent } from '@/types/chat';

const SESSION_ID_STORAGE_KEY = 'ai-chat-session-id';

/**
 * Returns the visitor's existing chat session id from localStorage, or
 * generates and persists a new one. Browser-only — must be called from
 * a Client Component, never during server rendering.
 */
export function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_ID_STORAGE_KEY, sessionId);
  return sessionId;
}

export function getChatHistory(sessionId: string): Promise<ChatHistoryResponse> {
  return apiClient.get<ChatHistoryResponse>(`/ai-chat/chat/${sessionId}`);
}

/**
 * Streams a chat completion. onEvent fires once per ChatStreamEvent, in
 * order, as they arrive — inherently callback-based, so it doesn't go
 * through apiClient.
 */
export async function streamChatMessage(
  sessionId: string,
  message: string,
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void> {
  const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/ai-chat/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId, message }),
  });
  await readEventStream(response, onEvent);
}

export type DiscoveryEvent =
  | { type: 'token'; content: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

/**
 * Project discovery: streams a short recommendation ('insight') or the
 * project brief ('brief') for the answers so far. Stateless on the
 * server; the transcript is the questions and answers the visitor saw.
 */
export async function streamDiscovery(
  kind: 'insight' | 'brief',
  transcript: Array<{ q: string; a: string[] }>,
  onEvent: (event: DiscoveryEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/ai-chat/discovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, transcript }),
    signal,
  });
  await readEventStream(response, onEvent);
}

type StreamError = { type: 'error'; message: string };

/**
 * Reads a Server-Sent Events body by hand. EventSource only supports GET
 * and these endpoints are POSTs, so this parses each `data: {...}\n\n`
 * frame from the fetch body, matching what the server writes.
 *
 * Always ends in a terminal event: a rejected request (rate limit,
 * validation) or a stream that closes early becomes an error event, so
 * callers never wait on an answer that isn't coming.
 */
async function readEventStream<E extends { type: string }>(
  response: Response,
  onEvent: (event: E | StreamError) => void,
): Promise<void> {
  if (!response.ok || !response.body) {
    onEvent({
      type: 'error',
      message:
        response.status === 429 ? 'You’ve reached the assistant’s limit for now. Try again in a few minutes.' : 'The assistant can’t answer right now.',
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finished = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line. Process every complete
    // frame in the buffer, keeping any trailing partial frame around
    // for the next chunk.
    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawFrame = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const dataLine = rawFrame.split('\n').find((line) => line.startsWith('data: '));
      if (!dataLine) {
        continue;
      }

      let event: E;
      try {
        event = JSON.parse(dataLine.slice('data: '.length)) as E;
      } catch {
        // Malformed frame — skip it rather than crash the whole stream
        // over one bad chunk.
        continue;
      }
      if (event.type === 'done' || event.type === 'error') finished = true;
      onEvent(event);
    }
  }

  if (!finished) onEvent({ type: 'error', message: 'The answer was cut off. Try again.' });
}
