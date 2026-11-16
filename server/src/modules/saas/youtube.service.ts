import { AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import { parseYoutubeChannel } from './source-identifiers.js';
import type { YoutubeStats, YoutubeVideoSummary } from './saas.types.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const REQUEST_TIMEOUT_MS = 8_000;
const RECENT_VIDEO_COUNT = 8;

interface YoutubeChannelStatistics {
  viewCount?: string;
  subscriberCount?: string;
  videoCount?: string;
  hiddenSubscriberCount?: boolean;
}

interface YoutubeChannelsResponse {
  // Absent, not empty, when no channel matches the ID.
  items?: Array<{
    id: string;
    statistics: YoutubeChannelStatistics;
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
  }>;
}

interface YoutubePlaylistItemsResponse {
  items: Array<{ contentDetails: { videoId: string } }>;
}

interface YoutubeVideosResponse {
  items: Array<{
    id: string;
    snippet: { title: string; publishedAt: string };
    statistics: { viewCount?: string };
  }>;
}

function apiUrl(path: string, params: Record<string, string>, key: string): string {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set('key', key);
  return url.toString();
}

async function getJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new AppError(`YouTube ${label} request failed: ${response.status}`, 502);
  }
  return (await response.json()) as T;
}

/**
 * Latest uploads with their view counts: two cheap calls (1 quota unit
 * each) against the channel's uploads playlist. Search is avoided on
 * purpose — it costs 100 units per call.
 */
async function fetchRecentVideos(uploadsPlaylistId: string, key: string): Promise<YoutubeVideoSummary[]> {
  const playlist = await getJson<YoutubePlaylistItemsResponse>(
    apiUrl('playlistItems', { part: 'contentDetails', playlistId: uploadsPlaylistId, maxResults: String(RECENT_VIDEO_COUNT) }, key),
    'playlist items',
  );
  const ids = playlist.items.map((item) => item.contentDetails.videoId);
  if (ids.length === 0) return [];

  const videos = await getJson<YoutubeVideosResponse>(
    apiUrl('videos', { part: 'snippet,statistics', id: ids.join(',') }, key),
    'videos',
  );

  return videos.items
    .map((video) => ({
      id: video.id,
      title: video.snippet.title,
      publishedAt: video.snippet.publishedAt,
      viewCount: video.statistics.viewCount ? parseInt(video.statistics.viewCount, 10) : 0,
    }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * The channel a customer saved, as a channel ID, an @handle or a channel
 * link (source-identifiers.ts). Each lookup is one quota unit, like the ID.
 */
export async function getYoutubeStats(saved: string): Promise<YoutubeStats> {
  const key = env.YOUTUBE_API_KEY;
  if (!key) {
    throw new AppError('Server misconfiguration: YOUTUBE_API_KEY is not set', 500);
  }

  const ref = parseYoutubeChannel(saved);
  if (!ref) {
    throw new AppError('YouTube channel not set', 404);
  }
  const lookup: Record<string, string> =
    'id' in ref ? { id: ref.id } : 'handle' in ref ? { forHandle: ref.handle } : { forUsername: ref.username };

  const data = await getJson<YoutubeChannelsResponse>(
    apiUrl('channels', { part: 'statistics,contentDetails', ...lookup }, key),
    'channels',
  );
  const channel = data.items?.[0];

  if (!channel) {
    throw new AppError(`YouTube channel "${saved}" not found`, 404);
  }
  const channelId = channel.id;

  // The recent-videos chart is secondary: if it fails, the channel totals
  // still render and the chart is simply left out.
  const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
  const recentVideos = uploads
    ? await fetchRecentVideos(uploads, key).catch((error) => {
        console.error('YouTube: recent videos lookup failed', error);
        return [];
      })
    : [];

  // The API returns these as strings, and subscriberCount is entirely
  // absent (not zero) when a channel owner has hidden it — see the
  // rationale above for why 0 is the chosen default in that case.
  const stats = channel.statistics;

  return {
    channelId,
    subscriberCount: stats.subscriberCount ? parseInt(stats.subscriberCount, 10) : 0,
    viewCount: stats.viewCount ? parseInt(stats.viewCount, 10) : 0,
    videoCount: stats.videoCount ? parseInt(stats.videoCount, 10) : 0,
    recentVideos,
  };
}
