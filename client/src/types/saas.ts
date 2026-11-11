export interface AuthResult {
  success: true;
}

export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export interface SaasMeResponse {
  email: string;
  subscriptionStatus: SubscriptionStatus;
  githubUsername?: string;
  youtubeChannelId?: string;
  brandSearchQuery?: string;
}

// Mirrors server/src/modules/saas/saas.types.ts.

export interface GithubRepoSummary {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string | null;
  archived: boolean;
  fork: boolean;
}

export interface GithubStats {
  username: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  /** Most-starred first, at most 20. */
  repos: GithubRepoSummary[];
}

export interface YoutubeVideoSummary {
  id: string;
  title: string;
  publishedAt: string;
  viewCount: number;
}

export interface YoutubeStats {
  channelId: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  /** Newest first; empty if the uploads lookup failed. */
  recentVideos: YoutubeVideoSummary[];
}

export interface HackerNewsMention {
  title: string;
  url: string;
  createdAt: string;
  kind: 'story' | 'comment';
}

export interface HackerNewsWeek {
  weekStart: string;
  count: number;
}

export interface HackerNewsStats {
  query: string;
  mentionCount: number;
  recentTitles: string[];
  recentMentions: HackerNewsMention[];
  /** Eight rolling weeks, oldest first; empty if a count failed. */
  weekly: HackerNewsWeek[];
}

export type SourceStatus = 'connected' | 'not_connected' | 'unavailable';

export interface AggregatorStats {
  github: GithubStats | null;
  youtube: YoutubeStats | null;
  hackerNews: HackerNewsStats | null;
  sources: {
    github: SourceStatus;
    youtube: SourceStatus;
    hackerNews: SourceStatus;
  };
  /** When these numbers were fetched (ISO); the reference for relative dates. */
  fetchedAt: string;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface UpdateSettingsInput {
  githubUsername?: string;
  youtubeChannelId?: string;
  brandSearchQuery?: string;
}

export interface UpdateSettingsResponse {
  githubUsername?: string;
  youtubeChannelId?: string;
  brandSearchQuery?: string;
}
