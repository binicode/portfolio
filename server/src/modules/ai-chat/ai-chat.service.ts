import { AppError } from '../../core/middleware/errorHandler.js';
import { isDatabaseReady } from '../../core/config/db.js';
import { ChatSessionModel } from './ai-chat.model.js';
import { embedText } from './embedding.service.js';
import { publishedProjects, retrieveFallbackChunks, retrieveRelevantChunks, seededSourceIds } from './retrieval.service.js';
import { streamChatCompletion } from './llm.service.js';
import {
  asksAboutWork,
  buildRetrievalQuery,
  keywordOverlap,
  publishedProjectsChunk,
  rankedStaticChunks,
  withUnseededSources,
} from './chat-context.js';
import { appendMemoryMessage, getMemorySession } from './session-store.js';
import type { ChatMessage, ChatStreamEvent, RetrievedChunk, SendChatMessageInput } from './ai-chat.types.js';
import { errorFields, log } from '../../core/logger.js';

// Conversation history sent to the LLM is capped independently of what's
// persisted — keeps per-turn input cost bounded as a session grows long,
// without throwing away the visitor's full conversation record.
const MAX_HISTORY_MESSAGES_SENT_TO_LLM = 20;

function getRecentHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-MAX_HISTORY_MESSAGES_SENT_TO_LLM);
}

/** A conversation's messages, and how to add one. */
interface ChatSessionHandle {
  messages: ChatMessage[];
  append(message: ChatMessage): Promise<void>;
}

function memorySession(sessionId: string): ChatSessionHandle {
  const handle: ChatSessionHandle = {
    messages: getMemorySession(sessionId),
    async append(message) {
      handle.messages = appendMemoryMessage(sessionId, message);
    },
  };
  return handle;
}

/**
 * The visitor's session from MongoDB, or, while the database is
 * unreachable, from the in-memory store, so the conversation keeps its
 * context instead of the chat failing. A save that fails mid-conversation
 * is logged and the turn carries on.
 */
async function openSession(sessionId: string): Promise<ChatSessionHandle> {
  if (isDatabaseReady()) {
    try {
      const session =
        (await ChatSessionModel.findOne({ sessionId })) ?? (await ChatSessionModel.create({ sessionId, messages: [] }));
      return {
        get messages() {
          return session.messages;
        },
        async append(message) {
          session.messages.push(message);
          try {
            await session.save();
          } catch (error) {
            log.warn('Chat: could not save the message, continuing without persistence', errorFields(error));
          }
        },
      };
    } catch (error) {
      log.warn('Chat: history unavailable, using in-memory history', errorFields(error));
    }
  }
  return memorySession(sessionId);
}

/** The stored conversation, for restoring the widget on page reload. */
export async function getSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  if (isDatabaseReady()) {
    try {
      const session = await ChatSessionModel.findOne({ sessionId }).lean();
      if (session) return session.messages;
    } catch (error) {
      log.warn('Chat: history unavailable for reading, using in-memory history', errorFields(error));
    }
  }
  return getMemorySession(sessionId);
}

/**
 * The context for this turn.
 * - Semantic retrieval on the latest question (with the previous one when
 *   the latest is a short follow-up), from Atlas Vector Search.
 * - When nothing clears the similarity floor (a greeting, "tell me more"),
 *   or the query can't be embedded (e.g. the embedding provider's free-tier
 *   limit of 3 requests per minute), the knowledge base as a whole: it is
 *   small, and an answer with all of it beats "I don't have that".
 * - Knowledge-base entries added since the last seed, and the case studies
 *   published in the CMS.
 * - Without a database: the knowledge base straight from the source file.
 */
async function retrieveContext(history: ChatMessage[]): Promise<RetrievedChunk[]> {
  const query = buildRetrievalQuery(history);
  if (!isDatabaseReady()) {
    return rankedStaticChunks(query);
  }

  // The whole (small) knowledge base, scored by keyword overlap so the
  // sources listed are the ones that match, for when vector search finds
  // nothing or can't run.
  const wholeKnowledgeBase = async () =>
    (await retrieveFallbackChunks()).map((chunk) => ({ ...chunk, score: keywordOverlap(query, chunk) }));

  let chunks: RetrievedChunk[];
  let vectorMatched = true;
  try {
    const queryEmbedding = await embedText(query, 'query');
    chunks = await retrieveRelevantChunks(queryEmbedding.values);
    if (chunks.length === 0) {
      chunks = await wholeKnowledgeBase();
      vectorMatched = false;
    }
  } catch (error) {
    log.warn('Chat: semantic retrieval unavailable, using the full knowledge base', errorFields(error));
    try {
      chunks = await wholeKnowledgeBase();
      vectorMatched = false;
    } catch {
      return rankedStaticChunks(query);
    }
  }

  try {
    const [seeded, projects] = await Promise.all([seededSourceIds(), publishedProjects()]);
    chunks = withUnseededSources(chunks, seeded, query, vectorMatched);
    const projectsChunk = publishedProjectsChunk(projects);
    if (projectsChunk && asksAboutWork(query)) chunks = [...chunks, { ...projectsChunk, score: 1 }];
  } catch (error) {
    log.warn('Chat: could not add new knowledge-base entries or case studies', errorFields(error));
  }
  return chunks;
}

/**
 * Orchestrates a single chat turn: loads/creates the session, retrieves RAG
 * context for the conversation, streams the LLM response, and persists
 * both sides of the exchange.
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

  const session = await openSession(input.sessionId);

  // Saved before generation starts, so a downstream failure still leaves a
  // record of what was asked.
  await session.append({ role: 'user', content: trimmedMessage, createdAt: new Date() });

  const history = getRecentHistory(session.messages);
  const retrievedChunks = await retrieveContext(history);

  let assistantReply = '';

  for await (const event of streamChatCompletion(history, retrievedChunks)) {
    if (event.type === 'token') {
      assistantReply += event.content;
    }

    yield event;

    if (event.type === 'done') {
      // Only a fully completed reply is persisted — a partial reply cut
      // short by an upstream error is intentionally discarded, not saved.
      await session.append({ role: 'assistant', content: assistantReply, createdAt: new Date() });
    }
  }
}
