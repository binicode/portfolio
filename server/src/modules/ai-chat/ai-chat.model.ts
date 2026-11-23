import { Schema, model, type HydratedDocument } from 'mongoose';
import type {
  ChatMessage,
  ChatSessionDocument,
  KnowledgeChunkDocument,
} from './ai-chat.types.js';

/**
 * The embedding model and its output size (embedding.service.ts requests
 * this size explicitly). voyage-4-lite supports 256, 512, 1024 and 2048
 * dimensions; 512 keeps the index as small as before.
 *
 * Vectors from different models can't be compared, so each chunk records
 * the model that embedded it and vector search considers only chunks from
 * EMBEDDING_MODEL. After changing the model, re-seed (`npm run seed:kb`):
 * until then retrieval falls back to the whole knowledge base instead of
 * returning poor matches.
 */
export const EMBEDDING_MODEL = 'voyage-4-lite';
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
      enum: ['bio', 'project', 'case-study', 'credentials', 'personal', 'skills'],
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
    embeddingModel: { type: String, required: true },
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

export const KNOWLEDGE_INDEX_DEFINITION = {
  fields: [
    { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMENSIONS, similarity: 'cosine' },
    { type: 'filter', path: 'metadata.sourceType' },
    { type: 'filter', path: 'embeddingModel' },
  ],
};

interface SearchIndexField {
  type?: string;
  path?: string;
  numDimensions?: number;
  similarity?: string;
}

/**
 * Whether an existing index has what retrieval relies on: the vector field
 * at EMBEDDING_DIMENSIONS and both filter fields. Only these are compared:
 * Atlas adds defaults of its own to a stored definition.
 */
export function indexDefinitionIsCurrent(fields: SearchIndexField[] | undefined): boolean {
  const vector = fields?.find((field) => field.type === 'vector' && field.path === 'embedding');
  const filters = new Set(fields?.filter((field) => field.type === 'filter').map((field) => field.path));
  return (
    vector?.numDimensions === EMBEDDING_DIMENSIONS &&
    vector.similarity === 'cosine' &&
    filters.has('metadata.sourceType') &&
    filters.has('embeddingModel')
  );
}

/**
 * Creates the Atlas Vector Search index on the knowledge_chunks collection,
 * or updates an older definition of it (for example one without the
 * embeddingModel filter). Safe to call on every server boot: Atlas builds
 * the index asynchronously, so this only issues the command and does not
 * wait for the index to become queryable.
 */
export async function ensureKnowledgeVectorIndex(): Promise<void> {
  const collection = KnowledgeChunkModel.collection;
  const existing = (await collection.listSearchIndexes(VECTOR_INDEX_NAME).toArray()) as Array<{
    name: string;
    latestDefinition?: { fields?: SearchIndexField[] };
  }>;
  const current = existing.find((index) => index.name === VECTOR_INDEX_NAME);

  if (!current) {
    await collection.createSearchIndex({ name: VECTOR_INDEX_NAME, type: 'vectorSearch', definition: KNOWLEDGE_INDEX_DEFINITION });
    return;
  }
  if (!indexDefinitionIsCurrent(current.latestDefinition?.fields)) {
    await collection.updateSearchIndex(VECTOR_INDEX_NAME, KNOWLEDGE_INDEX_DEFINITION);
  }
}