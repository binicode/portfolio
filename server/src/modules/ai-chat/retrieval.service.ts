import { KnowledgeChunkModel, VECTOR_INDEX_NAME } from './ai-chat.model.js';
import type { RetrievedChunk, VectorSearchOptions } from './ai-chat.types.js';

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