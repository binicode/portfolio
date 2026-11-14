import type { ReactNode } from 'react';
import { Eye, FolderGit2, Star, SquarePlay, Users } from 'lucide-react';
import type { AggregatorStats } from '@/types/saas';
import { formatCount, formatFigure } from './format';
import { REPO_STATUS_LABEL, REPO_STATUS_ORDER, repoInsights, type RepoStatusKey } from './insights';

const ICON = 'size-3.5';

// Status segments, most alive first: one hue for "Active", neutral steps for the rest.
const STATUS_FILL: Record<RepoStatusKey, string> = {
  active: 'bg-success',
  quiet: 'bg-chart-muted',
  dormant: 'bg-foreground/25',
  archived: 'bg-foreground/15',
  empty: 'bg-foreground/15',
};

function Cell({ icon, label, value, title, children, className = '' }: { icon: ReactNode; label: string; value: ReactNode; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col bg-card px-4 py-3.5 sm:px-5 sm:py-4 ${className}`}>
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span aria-hidden="true" className="text-accent-bright">
          {icon}
        </span>
        {label}
      </dt>
      <dd title={title} className="mt-2 text-figure-sm font-medium tabular-nums">
        {value}
      </dd>
      {children && <dd className="mt-1.5 truncate text-xs text-muted-foreground">{children}</dd>}
    </div>
  );
}

/**
 * The audience at a glance: five figures in one slim band, separated by
 * hairlines (a 1px grid gap over the border colour), wrapping 2 → 3 → 5 with
 * the space it gets. Typography carries it; the only graphic is the
 * repositories' status bar. Server-only, no client imports.
 */
export default function StatRail({ stats }: { stats: AggregatorStats }) {
  const { github, youtube } = stats;
  const repos = github ? repoInsights(github.repos, github.totalStars, Date.parse(stats.fetchedAt)) : null;
  const present = repos ? REPO_STATUS_ORDER.filter((key) => repos.counts[key] > 0) : [];
  const dash = '—';

  return (
    <section aria-labelledby="rail-title" className="@container">
      <h2 id="rail-title" className="sr-only">
        Audience
      </h2>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border @md:grid-cols-3 @3xl:grid-cols-5">
        <Cell icon={<Star className={ICON} strokeWidth={2} />} label="GitHub stars" value={github ? formatFigure(github.totalStars) : dash} title={github ? formatCount(github.totalStars) : undefined}>
          {github ? `on ${formatCount(github.publicRepos)} public repositories` : 'Connect GitHub'}
        </Cell>
        <Cell
          icon={<SquarePlay className={ICON} strokeWidth={2} />}
          label="Subscribers"
          value={youtube ? formatFigure(youtube.subscriberCount) : dash}
          title={youtube ? formatCount(youtube.subscriberCount) : undefined}
        >
          {youtube ? 'YouTube channel' : 'Connect YouTube'}
        </Cell>
        <Cell icon={<Users className={ICON} strokeWidth={2} />} label="Followers" value={github ? formatFigure(github.followers) : dash} title={github ? formatCount(github.followers) : undefined}>
          {github ? `@${github.username} on GitHub` : 'Connect GitHub'}
        </Cell>
        <Cell icon={<Eye className={ICON} strokeWidth={2} />} label="Total views" value={youtube ? formatFigure(youtube.viewCount) : dash} title={youtube ? formatCount(youtube.viewCount) : undefined}>
          {youtube ? `across ${formatCount(youtube.videoCount)} videos` : 'Connect YouTube'}
        </Cell>
        <Cell
          icon={<FolderGit2 className={ICON} strokeWidth={2} />}
          label="Active repositories"
          className="col-span-2 @md:col-span-2 @3xl:col-span-1"
          value={
            repos && repos.total > 0 ? (
              <>
                {repos.counts.active}
                <span className="text-muted-foreground"> / {repos.total}</span>
              </>
            ) : (
              dash
            )
          }
        >
          {repos && repos.total > 0 ? (
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="flex h-1.5 w-full max-w-28 gap-px overflow-hidden rounded-full">
                {present.map((key) => (
                  <span key={key} className={STATUS_FILL[key]} style={{ flexGrow: repos.counts[key] }} />
                ))}
              </span>
              <span className="sr-only">
                {present.map((key) => `${REPO_STATUS_LABEL[key]} ${repos.counts[key]}`).join(', ')}.
              </span>
              <span className="shrink-0">pushed in 30 days</span>
            </span>
          ) : (
            'Connect GitHub'
          )}
        </Cell>
      </dl>
    </section>
  );
}
