import { KnowledgeChunkModel, VECTOR_INDEX_NAME } from './ai-chat.model.js';
import { ProjectModel } from '../admin/content.model.js';
import type { PublishedProjectSummary } from './chat-context.js';
import type { RetrievedChunk, VectorSearchOptions } from './ai-chat.types.js';

// Both lookups below change only when content is seeded or published, so a
// short cache keeps them off the per-message path.
const CACHE_TTL_MS = 5 * 60 * 1000;

function cached<T>(load: () => Promise<T>): () => Promise<T> {
  let value: { data: T; at: number } | null = null;
  return async () => {
    if (value && Date.now() - value.at < CACHE_TTL_MS) return value.data;
    const data = await load();
    value = { data, at: Date.now() };
    return data;
  };
}

/** The knowledge-base sources present in the vector store (seeded). */
export const seededSourceIds = cached(async () => {
  const ids = await KnowledgeChunkModel.distinct('metadata.sourceId');
  return new Set(ids.map(String));
});

/** The case studies published in the CMS (read-only). */
export const publishedProjects = cached(() =>
  ProjectModel.find({ published: true }, { _id: 0, title: 1, slug: 1, summary: 1, techStack: 1 })
    .sort({ createdAt: -1 })
    .limit(12)
    .lean<PublishedProjectSummary[]>(),
);

// Retrieval-quality defaults, tuned by experimentation rather than by
// environment — deliberately not env vars. Override per-call via options.
const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_SCORE = 0.7;

// Atlas's ANN search quality improves when numCandidates is well above
// the returned limit. 15x is a reasonable middle ground; capped so a
// large topK override can't force an expensive full-collection scan.
const CANDIDATE_MULTIPLIER = 15;
const MAX_CANDIDATES = 500;

interface VectorSearchAggregationResult {
  content: string;
  metadata: RetrievedChunk['metadata'];
  score: number;
}

/**
 * Runs Atlas Vector Search against the knowledge base using a
 * precomputed query embedding. This function is intentionally unaware
 * of how the embedding was produced — embedding.service.ts owns that —
 * keeping this file solely responsible for the Mongo/Atlas concern.
 */
export async function retrieveRelevantChunks(
  queryEmbedding: number[],
  options: Partial<VectorSearchOptions> = {},
): Promise<RetrievedChunk[]> {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  const numCandidates = Math.min(topK * CANDIDATE_MULTIPLIER, MAX_CANDIDATES);

  const results = await KnowledgeChunkModel.aggregate<VectorSearchAggregationResult>([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates,
        limit: topK,
      },
    },
    {
      $project: {
        _id: 0,
        content: 1,
        metadata: 1,
        score: { $meta: 'vectorSearchScore' },
      },
    },
    {
      $match: {
        score: { $gte: minScore },
      },
    },
  ]);

  return results;
}

// Upper bound for the degraded path below. The knowledge base is small
// (a handful of curated chunks), so this normally means "all of it". If it
// grows well past this, the fallback should become keyword-based instead.
const FALLBACK_MAX_CHUNKS = 8;

/**
 * Degraded retrieval for when the query can't be embedded (the embedding
 * provider is rate-limited, slow or down). Returns the knowledge base
 * itself, capped, so the answer stays grounded in the same curated
 * content instead of the chat turn failing outright.
 */
export async function retrieveFallbackChunks(): Promise<RetrievedChunk[]> {
  const chunks = await KnowledgeChunkModel.find({}, { _id: 0, content: 1, metadata: 1 })
    .limit(FALLBACK_MAX_CHUNKS)
    .lean<Array<Pick<RetrievedChunk, 'content' | 'metadata'>>>();

  return chunks.map((chunk) => ({ ...chunk, score: 0 }));
}