export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export interface SaasUserDocument {
  email: string;
  passwordHash: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: SubscriptionStatus;
  githubUsername?: string;
  youtubeChannelId?: string;
  brandSearchQuery?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: true;
}

export interface GithubRepoSummary {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  /** ISO timestamp of the last push, or null for an empty repository. */
  pushedAt: string | null;
  archived: boolean;
  fork: boolean;
}

export interface GithubStats {
  username: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  /** Most-starred public repositories first (at most 20 of the first 100). */
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
  /** Latest uploads, newest first. Empty if the uploads lookup failed. */
  recentVideos: YoutubeVideoSummary[];
}

export interface HackerNewsMention {
  title: string;
  /** Link to the item on news.ycombinator.com. */
  url: string;
  createdAt: string;
  kind: 'story' | 'comment';
}

export interface HackerNewsWeek {
  /** ISO timestamp of the start of a rolling seven-day window. */
  weekStart: string;
  count: number;
}

export interface HackerNewsStats {
  query: string;
  mentionCount: number;
  recentTitles: string[];
  recentMentions: HackerNewsMention[];
  /** Eight rolling weeks, oldest first, the last ending now. Empty if any count failed. */
  weekly: HackerNewsWeek[];
}

/**
 * Whether a source has an identifier configured and, if so, whether the
 * provider answered. Lets the dashboard tell "add your username" apart
 * from "GitHub is unreachable right now".
 */
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
  /** When these numbers were fetched (ISO). */
  fetchedAt: string;
}
