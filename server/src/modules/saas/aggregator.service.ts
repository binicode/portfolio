import { getGithubStats } from './github.service.js';
import { getYoutubeStats } from './youtube.service.js';
import { getHackerNewsStats } from './hackernews.service.js';
import { loadSource } from './source-status.js';
import { TtlCache } from './ttl-cache.js';
import type { AggregatorStats, GithubStats, HackerNewsStats, SaasUserDocument, YoutubeStats } from './saas.types.js';

/**
 * Each provider's answer for an identifier is kept for 10 minutes and shared
 * by every account that tracks it. Dashboard loads and refreshes within that
 * time cost no provider quota (YouTube's daily units, GitHub's hourly limit)
 * and come back at once. `fetchedAt` is when the oldest of the numbers shown
 * was fetched.
 */
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

const githubCache = new TtlCache<GithubStats>(CACHE_TTL_MS, CACHE_MAX_ENTRIES);
const youtubeCache = new TtlCache<YoutubeStats>(CACHE_TTL_MS, CACHE_MAX_ENTRIES);
const hackerNewsCache = new TtlCache<HackerNewsStats>(CACHE_TTL_MS, CACHE_MAX_ENTRIES);

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
  const fetchTimes: number[] = [];
  const through =
    <T>(cache: TtlCache<T>, fetcher: (identifier: string) => Promise<T>) =>
    async (identifier: string): Promise<T> => {
      const { value, at } = await cache.get(identifier, () => fetcher(identifier));
      fetchTimes.push(at);
      return value;
    };

  const [github, youtube, hackerNews] = await Promise.all([
    loadSource(user.githubUsername, 'GitHub', through(githubCache, getGithubStats)),
    loadSource(user.youtubeChannelId, 'YouTube', through(youtubeCache, getYoutubeStats)),
    loadSource(user.brandSearchQuery, 'Hacker News', through(hackerNewsCache, getHackerNewsStats)),
  ]);

  return {
    github: github.data,
    youtube: youtube.data,
    hackerNews: hackerNews.data,
    sources: { github: github.status, youtube: youtube.status, hackerNews: hackerNews.status },
    fetchedAt: new Date(fetchTimes.length > 0 ? Math.min(...fetchTimes) : Date.now()).toISOString(),
  };
}
