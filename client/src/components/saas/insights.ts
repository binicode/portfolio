/**
 * Derived dashboard metrics. Pure functions over the stats the API already
 * returns: no I/O, no clock reads (callers pass `now`), runtime-import free so
 * they run under `node --test` directly. Every number shown in the highlight
 * widgets comes from here, so it is tested once and rendered everywhere.
 */
import type {
  AggregatorStats,
  GithubRepoSummary,
  HackerNewsWeek,
  SourceStatus,
  YoutubeVideoSummary,
} from '@/types/saas';

const DAY_MS = 24 * 60 * 60 * 1000;

export type RepoStatusKey = 'active' | 'quiet' | 'dormant' | 'archived' | 'empty';

export const REPO_STATUS_LABEL: Record<RepoStatusKey, string> = {
  active: 'Active',
  quiet: 'Quiet',
  dormant: 'Dormant',
  archived: 'Archived',
  empty: 'Empty',
};

/** Display order: most to least alive. Also the sort order for the status column. */
export const REPO_STATUS_ORDER: readonly RepoStatusKey[] = ['active', 'quiet', 'dormant', 'archived', 'empty'];

/** Activity from GitHub's own fields: archived flag and last push (30 days / 6 months). */
export function repoStatus(repo: Pick<GithubRepoSummary, 'archived' | 'pushedAt'>, now: number): RepoStatusKey {
  if (repo.archived) return 'archived';
  if (!repo.pushedAt) return 'empty';
  const days = (now - Date.parse(repo.pushedAt)) / DAY_MS;
  if (days <= 30) return 'active';
  if (days <= 180) return 'quiet';
  return 'dormant';
}

export interface RepoInsights {
  top: { name: string; stars: number; share: number } | null;
  counts: Record<RepoStatusKey, number>;
  total: number;
}

/** Top repository's share of all stars, and how many repositories are still moving. */
export function repoInsights(repos: GithubRepoSummary[], totalStars: number, now: number): RepoInsights {
  const counts: Record<RepoStatusKey, number> = { active: 0, quiet: 0, dormant: 0, archived: 0, empty: 0 };
  for (const repo of repos) counts[repoStatus(repo, now)] += 1;

  const top = repos.reduce<GithubRepoSummary | null>((best, repo) => (!best || repo.stars > best.stars ? repo : best), null);
  return {
    top: top && top.stars > 0 ? { name: top.name, stars: top.stars, share: totalStars > 0 ? top.stars / totalStars : 0 } : null,
    counts,
    total: repos.length,
  };
}

export interface Momentum {
  /** Recent half vs the half before: 0.18 = 18% higher. Null when the earlier half is zero. */
  change: number | null;
  recent: number;
  prior: number;
  /** Items in each half. */
  span: number;
}

/**
 * Average views on the newest half of recent uploads against the half before.
 * Needs at least four videos (two per side); `videos` is newest first.
 */
export function videoMomentum(videos: Pick<YoutubeVideoSummary, 'viewCount'>[]): Momentum | null {
  const span = Math.floor(videos.length / 2);
  if (span < 2) return null;
  const average = (list: typeof videos) => list.reduce((sum, video) => sum + video.viewCount, 0) / list.length;
  const recent = average(videos.slice(0, span));
  const prior = average(videos.slice(span, span * 2));
  return { change: prior > 0 ? recent / prior - 1 : null, recent, prior, span };
}

/** Mentions in the newest half of the weekly series against the half before. `weeks` is oldest first. */
export function mentionMomentum(weeks: Pick<HackerNewsWeek, 'count'>[]): Momentum | null {
  const span = Math.floor(weeks.length / 2);
  if (span < 1) return null;
  const total = (list: typeof weeks) => list.reduce((sum, week) => sum + week.count, 0);
  const recent = total(weeks.slice(-span));
  const prior = total(weeks.slice(-span * 2, -span));
  return { change: prior > 0 ? recent / prior - 1 : null, recent, prior, span };
}

/**
 * The repositories worth showing as a portfolio: the creator's own, live work
 * (no forks, nothing archived, nothing never pushed), most stars first, ties
 * to the most recent push.
 */
export function showcaseRepos(repos: GithubRepoSummary[], count: number): GithubRepoSummary[] {
  return repos
    .filter((repo) => !repo.fork && !repo.archived && repo.pushedAt)
    .sort((a, b) => b.stars - a.stars || Date.parse(b.pushedAt ?? '') - Date.parse(a.pushedAt ?? ''))
    .slice(0, count);
}

/** The newest week against the one before it. `weeks` is oldest first; needs two weeks. */
export function weekOverWeek(weeks: Pick<HackerNewsWeek, 'count'>[]): { current: number; previous: number; change: number | null } | null {
  if (weeks.length < 2) return null;
  const current = weeks[weeks.length - 1].count;
  const previous = weeks[weeks.length - 2].count;
  return { current, previous, change: previous > 0 ? current / previous - 1 : null };
}

export type ActivityKind = 'push' | 'video' | 'story' | 'comment';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** Repository name, video title or mention title. */
  title: string;
  at: string;
  url: string;
  /** Push: the repository's language and stars. Video: its views. */
  language?: string | null;
  stars?: number;
  views?: number;
}

/**
 * One feed across sources, newest first: pushes (from each repository's last
 * push), uploads and Hacker News mentions. Archived repositories are left
 * out; their last push is history, not activity.
 */
export function recentActivity(stats: Pick<AggregatorStats, 'github' | 'youtube' | 'hackerNews'>, limit: number): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const repo of stats.github?.repos ?? []) {
    if (!repo.pushedAt || repo.archived) continue;
    items.push({ id: `push:${repo.name}`, kind: 'push', title: repo.name, at: repo.pushedAt, url: repo.url, language: repo.language, stars: repo.stars });
  }
  for (const video of stats.youtube?.recentVideos ?? []) {
    items.push({
      id: `video:${video.id}`,
      kind: 'video',
      title: video.title,
      at: video.publishedAt,
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`,
      views: video.viewCount,
    });
  }
  (stats.hackerNews?.recentMentions ?? []).forEach((mention, index) => {
    items.push({ id: `hn:${index}:${mention.url}`, kind: mention.kind, title: mention.title, at: mention.createdAt, url: mention.url });
  });
  return items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, limit);
}

const SOURCE_NAMES = { github: 'GitHub', youtube: 'YouTube', hackerNews: 'Hacker News' } as const;

/** One line on source health for the page header: "All 3 sources are live." */
export function sourceSummary(sources: Record<keyof typeof SOURCE_NAMES, SourceStatus>): { live: number; total: number; text: string } {
  const entries = (Object.keys(SOURCE_NAMES) as Array<keyof typeof SOURCE_NAMES>).map((key) => ({ name: SOURCE_NAMES[key], status: sources[key] }));
  const live = entries.filter((entry) => entry.status === 'connected').length;
  const total = entries.length;
  if (live === total) return { live, total, text: `All ${total} sources are live.` };
  const issues = entries
    .filter((entry) => entry.status !== 'connected')
    .map((entry) => (entry.status === 'unavailable' ? `${entry.name} didn’t respond` : `${entry.name} isn’t connected`));
  const joined = issues.length > 1 ? `${issues.slice(0, -1).join(', ')} and ${issues[issues.length - 1]}` : issues[0];
  return { live, total, text: `${live} of ${total} sources are live: ${joined}.` };
}

/**
 * A round top for a value axis with halfway ticks that stay whole: 21 → 30,
 * 6,120 → 8,000. Never below 1.
 */
export function niceMax(max: number): number {
  if (!(max > 0)) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 1.2, 1.6, 2, 3, 4, 5, 6, 8, 10]) {
    const top = magnitude >= 1 ? Math.round(step * magnitude) : step * magnitude;
    if (top >= max && Number.isInteger(top / 2)) return top;
  }
  return 10 * magnitude;
}

export type Trend = 'up' | 'down' | 'flat';

/** Signed whole percent with a true minus sign: "+18%", "−7%", "0%". */
export function formatChange(change: number): { text: string; trend: Trend } {
  const percent = Math.round(change * 100);
  if (percent === 0) return { text: '0%', trend: 'flat' };
  return percent > 0 ? { text: `+${percent}%`, trend: 'up' } : { text: `−${Math.abs(percent)}%`, trend: 'down' };
}
