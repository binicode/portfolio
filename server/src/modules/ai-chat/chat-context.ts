import { knowledgeBaseSources } from './knowledge-base.content.js';
import type { ChatMessage, RetrievedChunk } from './ai-chat.types.js';

/**
 * Pure helpers that decide what context a chat turn gets. No database or
 * provider calls here, so they are unit-tested on their own
 * (chat-context.test.ts); retrieval.service.ts does the I/O.
 */

// A follow-up ("which of those use Stripe?", "tell me more") rarely carries
// enough meaning to match the knowledge base on its own. Below this length
// the previous question is searched together with it.
const FOLLOW_UP_MAX_CHARS = 80;
const MAX_QUERY_CHARS = 600;

/**
 * The text to embed for retrieval: the visitor's latest message, plus their
 * previous one when the latest is short enough to be a follow-up.
 */
export function buildRetrievalQuery(history: ChatMessage[]): string {
  const userTurns = history.filter((message) => message.role === 'user').map((message) => message.content.trim());
  const latest = userTurns.at(-1) ?? '';
  const previous = userTurns.at(-2);
  const query = previous && latest.length <= FOLLOW_UP_MAX_CHARS ? `${previous}\n${latest}` : latest;
  return query.slice(-MAX_QUERY_CHARS);
}

/**
 * The knowledge base straight from the source file, one chunk per entry.
 * Used when the database (and so vector search) is unreachable, so answers
 * stay grounded in the same curated content instead of failing.
 */
export function staticKnowledgeChunks(): RetrievedChunk[] {
  return knowledgeBaseSources.map((source) => ({
    content: source.content,
    metadata: {
      sourceTitle: source.sourceTitle,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      chunkIndex: 0,
    },
    score: 0,
  }));
}

// Words that say nothing about which note is relevant.
const STOPWORDS = new Set(
  ('the and for are but not you your yours with what which who whom whose when where why how does did has have had ' +
    'can could would should will just about tell more some any all this that these those them they their there here ' +
    'his him her hers its from into onto over than then also very much many like want need know does doing done ' +
    'project projects use uses used using work works make made build built thing things ' +
    'biniyam bini abera').split(' '),
);

function keywords(text: string): string[] {
  return [...new Set(text.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length >= 3 && !STOPWORDS.has(word)))];
}

function mentions(text: string, word: string): boolean {
  return text.includes(word) || (word.length > 5 && text.includes(word.slice(0, 5)));
}

/**
 * A crude relevance score for when vector search isn't available: each of
 * the query's keywords found in the chunk's title counts 2, in its text 1.
 * A keyword also counts when its first five letters appear
 * ("subscription" ~ "subscribe").
 */
export function keywordOverlap(query: string, chunk: RetrievedChunk): number {
  const title = chunk.metadata.sourceTitle.toLowerCase();
  const content = chunk.content.toLowerCase();
  return keywords(query).reduce((score, word) => score + (mentions(title, word) ? 2 : mentions(content, word) ? 1 : 0), 0);
}

const MAX_RANKED_CHUNKS = 6;

/**
 * The in-code knowledge base ranked against the question, for when vector
 * search is unavailable. Matching entries are scored by keyword overlap
 * (and so listed as sources); when nothing matches (a greeting, a vague
 * question) the whole knowledge base is given, unscored.
 */
export function rankedStaticChunks(query: string): RetrievedChunk[] {
  const all = staticKnowledgeChunks();
  const matched = all
    .map((chunk) => ({ ...chunk, score: keywordOverlap(query, chunk) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RANKED_CHUNKS);
  return matched.length > 0 ? matched : all;
}

/**
 * Adds the knowledge-base entries that are in the source file but not yet in
 * the vector store (added since the last `npm run seed:kb`), so new content
 * is used straight away. Once seeded, they are found by vector search
 * instead and stop being appended here. With a query they are scored by
 * keyword overlap; `onlyMatching` keeps just the ones that match (used when
 * vector search found relevant notes, so the rest would be noise).
 */
export function withUnseededSources(
  chunks: RetrievedChunk[],
  seededSourceIds: ReadonlySet<string>,
  query?: string,
  onlyMatching = false,
): RetrievedChunk[] {
  const present = new Set(chunks.map((chunk) => chunk.metadata.sourceId));
  const unseeded = staticKnowledgeChunks().filter(
    (chunk) => !seededSourceIds.has(chunk.metadata.sourceId) && !present.has(chunk.metadata.sourceId),
  );
  if (query === undefined) return [...chunks, ...unseeded];
  const scored = unseeded.map((chunk) => ({ ...chunk, score: keywordOverlap(query, chunk) }));
  return [...chunks, ...(onlyMatching ? scored.filter((chunk) => chunk.score > 0) : scored)];
}

// Questions about the body of work, which the published case studies answer.
const WORK_QUESTION = /\b(projects?|case stud|work|portfolio|built|build|shipped|made|examples?|experience)\b/i;

/** Whether the published case studies are relevant to this question. */
export function asksAboutWork(query: string): boolean {
  return WORK_QUESTION.test(query);
}

export interface PublishedProjectSummary {
  title: string;
  slug: string;
  summary: string;
  techStack: string[];
}

/**
 * The case studies published in the CMS, as one compact context chunk, so
 * the assistant knows the projects on the Work page by name.
 */
export function publishedProjectsChunk(projects: PublishedProjectSummary[]): RetrievedChunk | null {
  if (projects.length === 0) return null;
  const lines = projects.map(
    (project) =>
      `- ${project.title} (case study at /projects/${project.slug}): ${project.summary}` +
      (project.techStack.length > 0 ? ` Built with ${project.techStack.join(', ')}.` : ''),
  );
  return {
    content: `CASE STUDIES PUBLISHED ON THE WORK PAGE (/projects)\n${lines.join('\n')}`,
    metadata: { sourceTitle: 'Published case studies', sourceType: 'case-study', sourceId: 'cms-projects', chunkIndex: 0 },
    score: 0,
  };
}
