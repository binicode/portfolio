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
