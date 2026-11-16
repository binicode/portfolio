import { getGithubStats } from './github.service.js';
import { getYoutubeStats } from './youtube.service.js';
import { getHackerNewsStats } from './hackernews.service.js';
import { loadSource } from './source-status.js';
import type { AggregatorStats, SaasUserDocument } from './saas.types.js';

/**
 * Fetches all three data sources in parallel and combines them into
 * one response. Each source fails independently — a user who hasn't
 * configured a given identifier yet, an identifier the provider doesn't
 * know, or one API being temporarily down, shows up as null for just that
 * section rather than failing the entire request, and `sources` says which
 * it was (source-status.ts).
 */
export async function getAggregatedStats(
  user: Pick<SaasUserDocument, 'githubUsername' | 'youtubeChannelId' | 'brandSearchQuery'>,
): Promise<AggregatorStats> {
  const [github, youtube, hackerNews] = await Promise.all([
    loadSource(user.githubUsername, 'GitHub', getGithubStats),
    loadSource(user.youtubeChannelId, 'YouTube', getYoutubeStats),
    loadSource(user.brandSearchQuery, 'Hacker News', getHackerNewsStats),
  ]);

  return {
    github: github.data,
    youtube: youtube.data,
    hackerNews: hackerNews.data,
    sources: { github: github.status, youtube: youtube.status, hackerNews: hackerNews.status },
    fetchedAt: new Date().toISOString(),
  };
}
