import type { ChatMessage } from './ai-chat.types.js';

/**
 * In-memory chat history, used only while MongoDB is unreachable, so a
 * conversation keeps its context (follow-up questions still make sense)
 * instead of the chat failing. Per process and bounded: the oldest
 * sessions are dropped first, and each keeps only its latest messages.
 * Nothing here survives a restart; MongoDB remains the record.
 */

const MAX_SESSIONS = 500;
const MAX_MESSAGES_PER_SESSION = 40;

const sessions = new Map<string, ChatMessage[]>();

export function getMemorySession(sessionId: string): ChatMessage[] {
  return sessions.get(sessionId) ?? [];
}

export function appendMemoryMessage(sessionId: string, message: ChatMessage): ChatMessage[] {
  const messages = [...getMemorySession(sessionId), message].slice(-MAX_MESSAGES_PER_SESSION);
  // Re-inserting moves the session to the end: the map's order is recency.
  sessions.delete(sessionId);
  sessions.set(sessionId, messages);
  while (sessions.size > MAX_SESSIONS) {
    const oldest = sessions.keys().next().value;
    if (oldest === undefined) break;
    sessions.delete(oldest);
  }
  return messages;
}

/** Test hook. */
export function clearMemorySessions(): void {
  sessions.clear();
}

export const MEMORY_LIMITS = { MAX_SESSIONS, MAX_MESSAGES_PER_SESSION } as const;
