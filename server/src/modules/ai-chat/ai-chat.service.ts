import { AppError } from '../../core/middleware/errorHandler.js';
import { ChatSessionModel, type ChatSessionHydratedDocument } from './ai-chat.model.js';
import { embedText } from './embedding.service.js';
import { retrieveRelevantChunks } from './retrieval.service.js';
import { streamChatCompletion } from './llm.service.js';
import type { ChatMessage, ChatStreamEvent, SendChatMessageInput } from './ai-chat.types.js';

// Conversation history sent to the LLM is capped independently of what's
// persisted — keeps per-turn input cost bounded as a session grows long,
// without throwing away the visitor's full conversation record.
const MAX_HISTORY_MESSAGES_SENT_TO_LLM = 20;

async function getOrCreateSession(sessionId: string): Promise<ChatSessionHydratedDocument> {
  const existing = await ChatSessionModel.findOne({ sessionId });
  if (existing) {
    return existing;
  }

  return ChatSessionModel.create({ sessionId, messages: [] });
}

function getRecentHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_HISTORY_MESSAGES_SENT_TO_LLM);
}

/**
 * Orchestrates a single chat turn: loads/creates the session, embeds and
 * retrieves RAG context for the visitor's message, streams the LLM
 * response, and persists both sides of the exchange.
 *
 * Yields ChatStreamEvent frames — the controller only needs to iterate
 * this and forward each event over SSE.
 */
export async function* sendChatMessage(
  input: SendChatMessageInput,
): AsyncGenerator<ChatStreamEvent> {
  const trimmedMessage = input.message.trim();
  if (trimmedMessage.length === 0) {
    throw new AppError('Message cannot be empty', 400);
  }

  const session = await getOrCreateSession(input.sessionId);

  const userMessage: ChatMessage = {
    role: 'user',
    content: trimmedMessage,
    createdAt: new Date(),
  };

  // Persisted before generation starts, so a downstream failure still
  // leaves a record of what was asked.
  session.messages.push(userMessage);
  await session.save();

  const queryEmbedding = await embedText(trimmedMessage, 'query');
  const retrievedChunks = await retrieveRelevantChunks(queryEmbedding.values);
  const history = getRecentHistory(session.messages);

  let assistantReply = '';

  for await (const event of streamChatCompletion(history, retrievedChunks)) {
    if (event.type === 'token') {
      assistantReply += event.content;
    }

    yield event;

    if (event.type === 'done') {
      // Only a fully completed reply is persisted — a partial reply cut
      // short by an upstream error is intentionally discarded, not saved.
      session.messages.push({
        role: 'assistant',
        content: assistantReply,
        createdAt: new Date(),
      });
      await session.save();
    }
  }
}