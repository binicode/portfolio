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
 * Streams a chat completion by manually parsing the SSE response body.
 * The browser's native EventSource API cannot be used here — it only
 * supports GET requests, and this endpoint is a POST — so this reads
 * the fetch response body as a stream and parses each `data: {...}\n\n`
 * frame by hand, matching the exact format ai-chat.controller.ts
 * writes on the server.
 *
 * onEvent fires once per parsed ChatStreamEvent, in order, as they
 * arrive — inherently a callback-based operation, not a single awaited
 * value, so it doesn't go through apiClient.
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

  if (!response.body) {
    onEvent({ type: 'error', message: 'No response body received from the server.' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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

      const jsonPayload = dataLine.slice('data: '.length);
      try {
        const event = JSON.parse(jsonPayload) as ChatStreamEvent;
        onEvent(event);
      } catch {
        // Malformed frame — skip it rather than crash the whole stream
        // over one bad chunk.
        continue;
      }
    }
  }
}