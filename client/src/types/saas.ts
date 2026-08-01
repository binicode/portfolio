export interface AuthResult {
  success: true;
}

export type SubscriptionStatus = 'none' | 'active' | 'canceled' | 'past_due';

export interface SaasMeResponse {
  email: string;
  subscriptionStatus: SubscriptionStatus;
}

export interface GithubStats {
  username: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
}

export interface YoutubeStats {
  channelId: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
}

export interface HackerNewsStats {
  query: string;
  mentionCount: number;
  recentTitles: string[];
}

export interface AggregatorStats {
  github: GithubStats | null;
  youtube: YoutubeStats | null;
  hackerNews: HackerNewsStats | null;
}

export interface CheckoutSessionResponse {
  url: string;
}
