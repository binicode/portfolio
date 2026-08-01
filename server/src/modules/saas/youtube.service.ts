import { AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import type { YoutubeStats } from './saas.types.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface YoutubeChannelStatistics {
  viewCount?: string;
  subscriberCount?: string;
  videoCount?: string;
  hiddenSubscriberCount?: boolean;
}

interface YoutubeChannelsResponse {
  items: Array<{
    id: string;
    statistics: YoutubeChannelStatistics;
  }>;
}

export async function getYoutubeStats(channelId: string): Promise<YoutubeStats> {
  if (!env.YOUTUBE_API_KEY) {
    throw new AppError('Server misconfiguration: YOUTUBE_API_KEY is not set', 500);
  }

  const url = new URL(`${YOUTUBE_API_BASE}/channels`);
  url.searchParams.set('part', 'statistics');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', env.YOUTUBE_API_KEY);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new AppError(`YouTube channels request failed: ${response.status}`, 502);
  }

  const data = (await response.json()) as YoutubeChannelsResponse;
  const channel = data.items[0];

  if (!channel) {
    throw new AppError(`YouTube channel "${channelId}" not found`, 404);
  }

  // The API returns these as strings, and subscriberCount is entirely
  // absent (not zero) when a channel owner has hidden it — see the
  // rationale above for why 0 is the chosen default in that case.
  const stats = channel.statistics;

  return {
    channelId,
    subscriberCount: stats.subscriberCount ? parseInt(stats.subscriberCount, 10) : 0,
    viewCount: stats.viewCount ? parseInt(stats.viewCount, 10) : 0,
    videoCount: stats.videoCount ? parseInt(stats.videoCount, 10) : 0,
  };
}
