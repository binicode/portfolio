import DashboardBody from './DashboardBody';
import type { AggregatorStats, GithubRepoSummary } from '@/types/saas';

/**
 * A live-markup replica of the Creator Dashboard, filled with sample data.
 * It renders the real dashboard body (DashboardBody) in preview mode, so it
 * shows exactly what subscribers get and can never drift from it. HTML
 * rather than a screenshot: sharp at every size and a few KB.
 *
 * The frame is `inert`: its links, table region and hover readouts are
 * not focusable, clickable or exposed to assistive tech. The caption says
 * what it is.
 */

// Fixed reference time, so relative dates ("2 days ago") never change and the
// page stays static.
const SAMPLE_NOW = Date.UTC(2026, 10, 10, 12);
const ago = (days: number) => new Date(SAMPLE_NOW - days * 86_400_000).toISOString();

function repo(
  name: string,
  stars: number,
  forks: number,
  openIssues: number,
  pushedDaysAgo: number | null,
  language: string | null,
  extra: { description?: string; archived?: boolean; fork?: boolean } = {},
): GithubRepoSummary {
  return {
    name,
    url: `https://github.com/example/${name}`,
    description: extra.description ?? null,
    language,
    stars,
    forks,
    openIssues,
    pushedAt: pushedDaysAgo === null ? null : ago(pushedDaysAgo),
    archived: Boolean(extra.archived),
    fork: Boolean(extra.fork),
  };
}

const VIDEO_TITLES = [
  'Shipping a SaaS in six weeks',
  'Stripe webhooks without double charges',
  'Vector search on a budget',
  'Server Components in practice',
  'Designing dashboards people read',
  'From civil engineering to code',
  'Caching third-party APIs safely',
  'Building a headless storefront',
];
const VIDEO_VIEWS = [4210, 2980, 6120, 3340, 2210, 5150, 1880, 2620];

const SAMPLE: AggregatorStats = {
  github: {
    username: 'example',
    followers: 1284,
    publicRepos: 42,
    totalStars: 3917,
    repos: [
      repo('creator-analytics', 1204, 88, 14, 2, 'TypeScript', { description: 'GitHub, YouTube and Hacker News numbers in one dashboard.' }),
      repo('next-structural-ui', 862, 41, 6, 9, 'TypeScript', { description: 'Server-first UI kit for the Next.js App Router.' }),
      repo('vector-notes', 611, 33, 3, 47, 'Python', { description: 'Retrieval experiments with Voyage embeddings.' }),
      repo('shopify-headless-starter', 404, 30, 4, 240, 'TypeScript', { archived: true, description: 'Storefront API starter, superseded.' }),
      repo('stripe-webhook-kit', 298, 22, 1, 15, 'TypeScript'),
      repo('express-guardrails', 233, 19, 9, 120, 'JavaScript'),
      repo('dotfiles', 141, 7, 0, 3, 'Shell'),
      repo('hn-weekly', 41, 2, 0, 28, 'Go'),
    ],
  },
  youtube: {
    channelId: 'sample',
    subscriberCount: 12480,
    viewCount: 861302,
    videoCount: 96,
    recentVideos: VIDEO_TITLES.map((title, index) => ({
      id: `sample-${index}`,
      title,
      publishedAt: ago(index * 9 + 2),
      viewCount: VIDEO_VIEWS[index],
    })),
  },
  hackerNews: {
    query: 'creator analytics',
    mentionCount: 418,
    recentTitles: [],
    weekly: [7, 12, 9, 15, 11, 18, 14, 21].map((count, index) => ({ weekStart: ago((8 - index) * 7), count })),
    recentMentions: [
      { title: 'Show HN: A dashboard for creator metrics', url: 'https://news.ycombinator.com/', createdAt: ago(0.2), kind: 'story' },
      { title: 'Ask HN: How do you track your reach across platforms?', url: 'https://news.ycombinator.com/?ask', createdAt: ago(1.4), kind: 'story' },
      { title: 'Re: Creator analytics tools are mostly vanity metrics', url: 'https://news.ycombinator.com/?re', createdAt: ago(3), kind: 'comment' },
    ],
  },
  sources: { github: 'connected', youtube: 'connected', hackerNews: 'connected' },
  fetchedAt: new Date(SAMPLE_NOW).toISOString(),
};

export default function DashboardPreview({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <figure className={className}>
      <div inert className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_40px_80px_-40px_rgb(0_0_0/0.6)]">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <p className="text-[0.8125rem] font-semibold">Creator Dashboard</p>
          <div className="label flex items-center gap-4 text-muted-foreground">
            <span className="rounded-xs border border-success/40 px-2 py-0.5 text-success">Pro</span>
            <span className="hidden text-foreground sm:inline">Dashboard</span>
            <span className="hidden sm:inline">Settings</span>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          <p className="mb-3 text-h3 font-medium sm:mb-4">Your reach</p>
          <DashboardBody stats={SAMPLE} preview compact={compact} />
        </div>
      </div>
      <figcaption className="mt-3 text-[0.8125rem] text-muted-foreground">
        The Creator Dashboard, shown with sample data.
      </figcaption>
    </figure>
  );
}
