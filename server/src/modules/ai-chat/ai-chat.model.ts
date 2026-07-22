import { Schema, model, type HydratedDocument } from 'mongoose';
import type {
  ChatMessage,
  ChatSessionDocument,
  KnowledgeChunkDocument,
} from './ai-chat.types.js';

/**
 * Must match the output dimension of the embedding model used in
 * embedding.service.ts. voyage-3-lite produces 512-dimensional vectors.
 * If the embedding model changes, this constant AND the Atlas vector
 * index must be updated together — a mismatch fails silently at query
 * time, not at write time.
 */
export const EMBEDDING_DIMENSIONS = 512;

export const VECTOR_INDEX_NAME = 'knowledge_vector_index';

const chatMessageSchema = new Schema<ChatMessage>(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const chatSessionSchema = new Schema<ChatSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true },
);

// Visitor demo sessions don't need to persist indefinitely — auto-expire
// 30 days after the last activity for storage hygiene and data retention.
chatSessionSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export type ChatSessionHydratedDocument = HydratedDocument<ChatSessionDocument>;

export const ChatSessionModel = model<ChatSessionDocument>(
  'ChatSession',
  chatSessionSchema,
);

const knowledgeChunkMetadataSchema = new Schema(
  {
    sourceTitle: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ['bio', 'project', 'case-study'],
      required: true,
    },
    sourceId: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
  },
  { _id: false },
);

const knowledgeChunkSchema = new Schema<KnowledgeChunkDocument>(
  {
    content: { type: String, required: true },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: (values: number[]) => values.length === EMBEDDING_DIMENSIONS,
        message: `embedding must have exactly ${EMBEDDING_DIMENSIONS} dimensions`,
      },
    },
    metadata: { type: knowledgeChunkMetadataSchema, required: true },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'knowledge_chunks' },
);

export type KnowledgeChunkHydratedDocument = HydratedDocument<KnowledgeChunkDocument>;

export const KnowledgeChunkModel = model<KnowledgeChunkDocument>(
  'KnowledgeChunk',
  knowledgeChunkSchema,
);

/**
 * Creates the Atlas Vector Search index on the knowledge_chunks collection
 * if it doesn't already exist. Safe to call on every server boot — Atlas
 * index creation is asynchronous server-side, so this only issues the
 * create command and does not block on the index becoming queryable.
 *
 * Call this once after mongoose.connect() resolves, e.g. from db.ts's
 * connection success path.
 */
export async function ensureKnowledgeVectorIndex(): Promise<void> {
  const collection = KnowledgeChunkModel.collection;
  const existingIndexes = (await collection
    .listSearchIndexes()
    .toArray()) as Array<{ name: string }>;

  const alreadyExists = existingIndexes.some(
    (index) => index.name === VECTOR_INDEX_NAME,
  );

  if (alreadyExists) {
    return;
  }

  await collection.createSearchIndex({
    name: VECTOR_INDEX_NAME,
    type: 'vectorSearch',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: EMBEDDING_DIMENSIONS,
          similarity: 'cosine',
        },
        {
          type: 'filter',
          path: 'metadata.sourceType',
        },
      ],
    },
  });
}