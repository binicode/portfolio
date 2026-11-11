import { AppError } from '../../core/middleware/errorHandler.js';
import type { HackerNewsMention, HackerNewsStats, HackerNewsWeek } from './saas.types.js';

const HN_ALGOLIA_SEARCH_BY_DATE_BASE = 'https://hn.algolia.com/api/v1/search_by_date';
const HN_ITEM_BASE = 'https://news.ycombinator.com/item?id=';
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RECENT_TITLES = 5;
const WEEKS = 8;
const WEEK_SECONDS = 7 * 24 * 60 * 60;

interface HnAlgoliaHit {
  objectID: string;
  title: string | null;
  story_title: string | null;
  created_at: string;
  _tags?: string[];
}

interface HnAlgoliaResponse {
  hits: HnAlgoliaHit[];
  nbHits: number;
}

async function search(params: Record<string, string>): Promise<HnAlgoliaResponse> {
  const url = new URL(HN_ALGOLIA_SEARCH_BY_DATE_BASE);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);

  const response = await fetch(url.toString(), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

  if (!response.ok) {
    throw new AppError(`Hacker News search request failed: ${response.status}`, 502);
  }

  return (await response.json()) as HnAlgoliaResponse;
}

/**
 * Mentions per rolling seven-day window for the last eight weeks, oldest
 * first. Each window is a count-only query (hitsPerPage=0), so the numbers
 * are exact however popular the term is. If any window fails the series is
 * dropped rather than drawn with a hole in it.
 */
async function weeklyCounts(query: string): Promise<HackerNewsWeek[]> {
  const now = Math.floor(Date.now() / 1000);
  const windows = Array.from({ length: WEEKS }, (_, index) => {
    const end = now - (WEEKS - 1 - index) * WEEK_SECONDS;
    return { start: end - WEEK_SECONDS, end };
  });

  try {
    const counts = await Promise.all(
      windows.map(({ start, end }) =>
        search({
          query,
          tags: '(story,comment)',
          numericFilters: `created_at_i>${start},created_at_i<=${end}`,
          hitsPerPage: '0',
        }).then((data) => data.nbHits),
      ),
    );
    return windows.map(({ start }, index) => ({
      weekStart: new Date(start * 1000).toISOString(),
      count: counts[index],
    }));
  } catch (error) {
    console.error('Hacker News: weekly counts failed', error);
    return [];
  }
}

/**
 * Searches Hacker News (via Algolia's free, keyless search API) for
 * mentions of the given query across story titles and comment text.
 * Uses search_by_date specifically, not the default relevance-ranked
 * search — this returns strictly newest-first results, matching what
 * "recent" actually means.
 */
export async function getHackerNewsStats(query: string): Promise<HackerNewsStats> {
  // Algolia treats "story,comment" as AND; the parenthesised form is OR.
  const [data, weekly] = await Promise.all([search({ query, tags: '(story,comment)' }), weeklyCounts(query)]);

  // A comment hit's own title is always null — only the parent story
  // has one — so story_title is the fallback. If both are missing,
  // the hit is dropped rather than showing a blank entry.
  const recentMentions: HackerNewsMention[] = data.hits
    .map((hit) => ({ hit, title: hit.title ?? hit.story_title }))
    .filter((entry): entry is { hit: HnAlgoliaHit; title: string } => Boolean(entry.title))
    .slice(0, MAX_RECENT_TITLES)
    .map(({ hit, title }) => ({
      title,
      url: `${HN_ITEM_BASE}${encodeURIComponent(hit.objectID)}`,
      createdAt: hit.created_at,
      kind: hit._tags?.includes('comment') ? 'comment' : 'story',
    }));

  return {
    query,
    mentionCount: data.nbHits,
    recentTitles: recentMentions.map((mention) => mention.title),
    recentMentions,
    weekly,
  };
}
