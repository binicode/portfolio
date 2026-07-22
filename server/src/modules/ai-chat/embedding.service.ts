import { env } from '../../core/config/env.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { EMBEDDING_DIMENSIONS } from './ai-chat.model.js';
import type { EmbeddingVector } from './ai-chat.types.js';

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-3-lite';

// Voyage's documented per-request batch limit. embedBatch chunks larger
// input arrays against this so callers never have to think about it.
const MAX_TEXTS_PER_REQUEST = 128;

export type EmbeddingInputType = 'query' | 'document';

interface VoyageEmbeddingsResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

async function callVoyageEmbeddingsApi(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<number[][]> {
  if (!env.VOYAGE_API_KEY) {
    throw new AppError('VOYAGE_API_KEY is not configured', 500);
  }

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new AppError(
      `Voyage embeddings request failed: ${response.status} ${errorBody}`,
      502,
    );
  }

  const body = (await response.json()) as VoyageEmbeddingsResponse;

  // Voyage returns results in input order already, but sort defensively
  // in case that ever changes upstream.
  return [...body.data]
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

function assertDimensions(embedding: number[]): void {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new AppError(
      `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`,
      502,
    );
  }
}

export async function embedText(
  text: string,
  inputType: EmbeddingInputType,
): Promise<EmbeddingVector> {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new AppError('Cannot embed empty text', 400);
  }

  const [embedding] = await callVoyageEmbeddingsApi([trimmed], inputType);
  assertDimensions(embedding);

  return { values: embedding, model: VOYAGE_MODEL };
}

export async function embedBatch(
  texts: string[],
  inputType: EmbeddingInputType,
): Promise<EmbeddingVector[]> {
  const trimmedTexts = texts.map((text) => text.trim());
  if (trimmedTexts.some((text) => text.length === 0)) {
    throw new AppError('Cannot embed empty text in batch', 400);
  }

  const results: EmbeddingVector[] = [];

  for (let start = 0; start < trimmedTexts.length; start += MAX_TEXTS_PER_REQUEST) {
    const chunk = trimmedTexts.slice(start, start + MAX_TEXTS_PER_REQUEST);
    const embeddings = await callVoyageEmbeddingsApi(chunk, inputType);

    embeddings.forEach(assertDimensions);
    embeddings.forEach((embedding) => {
      results.push({ values: embedding, model: VOYAGE_MODEL });
    });
  }

  return results;
}