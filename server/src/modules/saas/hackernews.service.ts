import { AppError } from '../../core/middleware/errorHandler.js';
import type { HackerNewsStats } from './saas.types.js';

const HN_ALGOLIA_SEARCH_BY_DATE_BASE = 'https://hn.algolia.com/api/v1/search_by_date';
const MAX_RECENT_TITLES = 5;

interface HnAlgoliaHit {
  title: string | null;
  story_title: string | null;
}

interface HnAlgoliaResponse {
  hits: HnAlgoliaHit[];
  nbHits: number;
}

/**
 * Searches Hacker News (via Algolia's free, keyless search API) for
 * mentions of the given query across story titles and comment text.
 * Uses search_by_date specifically, not the default relevance-ranked
 * search — this returns strictly newest-first results, matching what
 * "recent" actually means.
 */
export async function getHackerNewsStats(query: string): Promise<HackerNewsStats> {
  const url = new URL(HN_ALGOLIA_SEARCH_BY_DATE_BASE);
  url.searchParams.set('query', query);
  url.searchParams.set('tags', 'story,comment');

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new AppError(`Hacker News search request failed: ${response.status}`, 502);
  }

  const data = (await response.json()) as HnAlgoliaResponse;

  // A comment hit's own title is always null — only the parent story
  // has one — so story_title is the fallback. If both are missing,
  // the hit is dropped rather than showing a blank entry.
  const recentTitles = data.hits
    .map((hit) => hit.title ?? hit.story_title)
    .filter((title): title is string => Boolean(title))
    .slice(0, MAX_RECENT_TITLES);

  return {
    query,
    mentionCount: data.nbHits,
    recentTitles,
  };
}
