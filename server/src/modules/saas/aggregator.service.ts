import { getGithubStats } from './github.service.js';
import { getYoutubeStats } from './youtube.service.js';
import { getHackerNewsStats } from './hackernews.service.js';
import type { AggregatorStats, SaasUserDocument, SourceStatus } from './saas.types.js';

/**
 * Runs one source: not configured → not_connected; provider error →
 * unavailable (logged, not swallowed); otherwise connected.
 */
async function load<T>(
  identifier: string | undefined,
  label: string,
  fetcher: (identifier: string) => Promise<T>,
): Promise<{ data: T | null; status: SourceStatus }> {
  if (!identifier) return { data: null, status: 'not_connected' };
  try {
    return { data: await fetcher(identifier), status: 'connected' };
  } catch (error) {
    console.error(`Aggregator: ${label} fetch failed`, error);
    return { data: null, status: 'unavailable' };
  }
}

/**
 * Fetches all three data sources in parallel and combines them into
 * one response. Each source fails independently — a user who hasn't
 * configured a given identifier yet, or one API being temporarily
 * down, shows up as null for just that section rather than failing
 * the entire request, and `sources` says which of the two it was.
 */
export async function getAggregatedStats(
  user: Pick<SaasUserDocument, 'githubUsername' | 'youtubeChannelId' | 'brandSearchQuery'>,
): Promise<AggregatorStats> {
  const [github, youtube, hackerNews] = await Promise.all([
    load(user.githubUsername, 'GitHub', getGithubStats),
    load(user.youtubeChannelId, 'YouTube', getYoutubeStats),
    load(user.brandSearchQuery, 'Hacker News', getHackerNewsStats),
  ]);

  return {
    github: github.data,
    youtube: youtube.data,
    hackerNews: hackerNews.data,
    sources: { github: github.status, youtube: youtube.status, hackerNews: hackerNews.status },
    fetchedAt: new Date().toISOString(),
  };
}
