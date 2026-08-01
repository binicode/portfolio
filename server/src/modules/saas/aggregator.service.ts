import { getGithubStats } from './github.service.js';
import { getYoutubeStats } from './youtube.service.js';
import { getHackerNewsStats } from './hackernews.service.js';
import type { AggregatorStats, SaasUserDocument } from './saas.types.js';

/**
 * Fetches all three data sources in parallel and combines them into
 * one response. Each source fails independently — a user who hasn't
 * configured a given identifier yet, or one API being temporarily
 * down, shows up as null for just that section rather than failing
 * the entire request. Failures are still logged, not silently
 * swallowed.
 */
export async function getAggregatedStats(
  user: Pick<SaasUserDocument, 'githubUsername' | 'youtubeChannelId' | 'brandSearchQuery'>,
): Promise<AggregatorStats> {
  const [github, youtube, hackerNews] = await Promise.all([
    user.githubUsername
      ? getGithubStats(user.githubUsername).catch((error) => {
          console.error('Aggregator: GitHub fetch failed', error);
          return null;
        })
      : Promise.resolve(null),
    user.youtubeChannelId
      ? getYoutubeStats(user.youtubeChannelId).catch((error) => {
          console.error('Aggregator: YouTube fetch failed', error);
          return null;
        })
      : Promise.resolve(null),
    user.brandSearchQuery
      ? getHackerNewsStats(user.brandSearchQuery).catch((error) => {
          console.error('Aggregator: Hacker News fetch failed', error);
          return null;
        })
      : Promise.resolve(null),
  ]);

  return { github, youtube, hackerNews };
}
