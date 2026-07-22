/**
 * Shared type definitions for the ai-chat module.
 * Pure types only — no runtime logic or dependencies live here.
 */

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
}

export interface ChatSessionDocument {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeSourceType = 'bio' | 'project' | 'case-study';

export interface KnowledgeChunkMetadata {
  sourceTitle: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  chunkIndex: number;
}

export interface KnowledgeChunkDocument {
  content: string;
  embedding: number[];
  metadata: KnowledgeChunkMetadata;
  createdAt: Date;
}

export interface RetrievedChunk {
  content: string;
  metadata: KnowledgeChunkMetadata;
  score: number;
}

export interface RagContext {
  query: string;
  retrievedChunks: RetrievedChunk[];
}

export interface EmbeddingVector {
  values: number[];
  model: string;
}

export interface VectorSearchOptions {
  topK: number;
  minScore?: number;
}

export interface ChatCompletionUsage {
  inputTokens: number;
  outputTokens: number;
}

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | {
      type: 'done';
      usage: ChatCompletionUsage;
      retrievedSources: Pick<KnowledgeChunkMetadata, 'sourceTitle' | 'sourceType'>[];
    }
  | { type: 'error'; message: string };

export interface SendChatMessageInput {
  sessionId: string;
  message: string;
}