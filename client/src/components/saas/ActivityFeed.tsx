import type { ReactNode } from 'react';
import { GitCommitHorizontal, MessageSquareText, MessagesSquare, SquarePlay } from 'lucide-react';
import type { AggregatorStats } from '@/types/saas';
import { formatCount, formatTimeAgo } from './format';
import { recentActivity, type ActivityItem, type ActivityKind } from './insights';

const ICON = 'size-4';

const KIND: Record<ActivityKind, { icon: ReactNode; describe: (item: ActivityItem) => string }> = {
  push: {
    icon: <GitCommitHorizontal className={ICON} strokeWidth={2} />,
    describe: (item) => ['GitHub push', item.language, item.stars !== undefined ? `${formatCount(item.stars)} stars` : null].filter(Boolean).join(' · '),
  },
  video: {
    icon: <SquarePlay className={ICON} strokeWidth={2} />,
    describe: (item) => `New video · ${formatCount(item.views ?? 0)} views`,
  },
  story: {
    icon: <MessagesSquare className={ICON} strokeWidth={2} />,
    describe: () => 'Hacker News story',
  },
  comment: {
    icon: <MessageSquareText className={ICON} strokeWidth={2} />,
    describe: () => 'Hacker News comment',
  },
};

/**
 * One timeline across sources, newest first: repository pushes, uploads and
 * Hacker News mentions. Times are relative to when the numbers were fetched.
 * In the demo (`links` off) titles are plain text, as the sample URLs aren't
 * real.
 */
export default function ActivityFeed({ stats, limit, links = true, className = '' }: { stats: AggregatorStats; limit: number; links?: boolean; className?: string }) {
  const now = Date.parse(stats.fetchedAt);
  const items = recentActivity(stats, limit);

  return (
    <section id="activity" aria-labelledby="activity-title" className={`dash-card min-w-0 scroll-mt-6 rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="activity-title" className="text-body-sm font-medium">
          Recent activity
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity yet. Connect a source in Settings.</p>
      ) : (
        <ol className="mt-3">
          {items.map((item) => {
            const kind = KIND[item.kind];
            const title = item.kind === 'push' ? `Pushed to ${item.title}` : item.title;
            return (
              // A timeline: each event's icon on a thin rail that joins it to the next.
              <li
                key={item.id}
                className="relative py-2 pl-10 before:absolute before:bottom-[-0.5rem] before:left-[0.8125rem] before:top-9 before:w-px before:bg-border last:before:hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-2 grid size-7 place-items-center rounded-full border border-border bg-muted text-muted-foreground [&_svg]:size-3.5"
                >
                  {kind.icon}
                </span>
                <p className="truncate text-sm">
                  {links ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent-bright">
                      {title}
                    </a>
                  ) : (
                    title
                  )}
                </p>
                <p className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate">{kind.describe(item)}</span>
                  <time dateTime={item.at} className="ml-auto shrink-0 font-mono text-micro">
                    {formatTimeAgo(item.at, now)}
                  </time>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
