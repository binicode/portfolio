import { connectDB, disconnectDB } from '../../../core/config/db.js';
import { embedBatch } from '../embedding.service.js';
import { KnowledgeChunkModel, ensureKnowledgeVectorIndex } from '../ai-chat.model.js';
import { knowledgeBaseSources } from '../knowledge-base.content.js';

// Paragraph-aware chunking, capped at ~400 words per chunk. Related
// paragraphs stay together up to the cap rather than splitting
// mid-thought, which keeps each chunk coherent enough to stand alone
// as retrieved context.
const MAX_WORDS_PER_CHUNK = 400;

function chunkText(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const wordCount = paragraph.split(/\s+/).length;

    if (currentWordCount + wordCount > MAX_WORDS_PER_CHUNK && currentChunk.length > 0) {
      chunks.push(currentChunk.join('\n\n'));
      currentChunk = [];
      currentWordCount = 0;
    }

    currentChunk.push(paragraph);
    currentWordCount += wordCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n\n'));
  }

  return chunks;
}

async function seed(): Promise<void> {
  await connectDB();
  await ensureKnowledgeVectorIndex();

  console.log(`Seeding knowledge base from ${knowledgeBaseSources.length} source(s)...`);

  // Full rebuild, not an incremental append — this script is the single
  // source of truth for what's in the collection, so re-running it
  // should never leave stale or duplicate chunks behind.
  await KnowledgeChunkModel.deleteMany({});

  for (const source of knowledgeBaseSources) {
    const chunks = chunkText(source.content);

    if (chunks.length === 0) {
      console.warn(`  ⚠️  Skipping "${source.sourceTitle}" — no content to chunk`);
      continue;
    }

    const embeddings = await embedBatch(chunks, 'document');

    const documents = chunks.map((content, index) => ({
      content,
      embedding: embeddings[index].values,
      metadata: {
        sourceTitle: source.sourceTitle,
        sourceType: source.sourceType,
        sourceId: source.sourceId,
        chunkIndex: index,
      },
    }));

    await KnowledgeChunkModel.insertMany(documents);
    console.log(`  ✓ "${source.sourceTitle}" — ${chunks.length} chunk(s) embedded and stored`);
  }

  console.log('Knowledge base seeding complete.');
  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('❌ Knowledge base seeding failed:', err);
  await disconnectDB();
  process.exit(1);
});