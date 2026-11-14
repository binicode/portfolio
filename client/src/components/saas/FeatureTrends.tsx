import type { ReactNode } from 'react';
import Link from 'next/link';
import { MessagesSquare, SquarePlay } from 'lucide-react';
import type { AggregatorStats, SourceStatus } from '@/types/saas';
import type { ChartFrameComponent } from './charts/ChartFrame';
import TrendLine, { type TrendPoint } from './charts/TrendLine';
import TrendColumns from './charts/TrendColumns';
import DeltaPill from './DeltaPill';
import { formatCount, formatFigure, formatShortDate } from './format';
import { videoMomentum, weekOverWeek } from './insights';

// A week's last day: six days after it starts ("Nov 6 – Nov 12").
const WEEK_LAST_DAY_MS = 6 * 24 * 60 * 60 * 1000;
const PLOT_HEIGHT = 'h-32 sm:h-36';

function Gap({ source, status, hint, links }: { source: string; status: SourceStatus; hint: string; links: boolean }) {
  if (status === 'unavailable') return <p className="text-sm text-muted-foreground">{source} didn’t respond. Refresh to retry.</p>;
  return (
    <div className="text-sm text-muted-foreground">
      <p>{hint}</p>
      {links && (
        <Link href="/saas/dashboard/settings" className="link mt-3 inline-block font-medium text-foreground">
          Connect {source}
        </Link>
      )}
    </div>
  );
}

/**
 * A feature card: the source and range on top, the headline figure large
 * with its context and change beside it, then the chart that explains it.
 * The number and its chart share one card, so neither repeats elsewhere.
 */
function Feature({
  id,
  icon,
  source,
  range,
  figure,
  className = '',
  children,
}: {
  id: string;
  icon: ReactNode;
  source: string;
  range?: string;
  figure?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`dash-card flex min-w-0 scroll-mt-6 flex-col rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden="true" className="text-accent-bright">
            {icon}
          </span>
          <span className="min-w-0">{source}</span>
        </h2>
        {range && <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{range}</span>}
      </div>
      {figure && <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5">{figure}</div>}
      <div className="mt-5 flex-1">{children}</div>
    </section>
  );
}

function Figure({ value, title, unit }: { value: string; title?: string; unit: string }) {
  return (
    <>
      <span title={title} className="text-figure-lg font-medium tabular-nums">
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{unit}</span>
    </>
  );
}

/**
 * The two trend features side by side (7 / 5 from `@3xl`): Hacker News
 * mentions per week as a line, YouTube views per video as columns. Server
 * rendered with no client imports; the dashboard passes `ChartFrame` for
 * hover and arrow-key readouts, the home page poster passes nothing.
 */
// Literal class strings, so Tailwind sees them: side by side from @3xl in the
// dashboard, from @xl in the home page poster's narrower column.
const SPLIT = {
  dashboard: { grid: '@3xl:grid-cols-12', wide: '@3xl:col-span-7', narrow: '@3xl:col-span-5' },
  poster: { grid: '@xl:grid-cols-12', wide: '@xl:col-span-7', narrow: '@xl:col-span-5' },
} as const;

export default function FeatureTrends({
  stats,
  links = true,
  Frame,
  splitAt = 'dashboard',
}: {
  stats: AggregatorStats;
  links?: boolean;
  Frame?: ChartFrameComponent;
  /** Where the two cards go side by side: the dashboard's width or the poster's. */
  splitAt?: keyof typeof SPLIT;
}) {
  const split = SPLIT[splitAt];
  const { youtube, hackerNews: hn } = stats;
  const week = hn ? weekOverWeek(hn.weekly) : null;
  const recentVideos = youtube?.recentVideos ?? [];
  const momentum = videoMomentum(recentVideos);

  const weeks: TrendPoint[] = (hn?.weekly ?? []).map((entry) => ({
    key: entry.weekStart,
    value: entry.count,
    axis: formatShortDate(entry.weekStart),
    detail: `${formatShortDate(entry.weekStart)} – ${formatShortDate(new Date(Date.parse(entry.weekStart) + WEEK_LAST_DAY_MS).toISOString())}`,
  }));
  const videos: TrendPoint[] = [...recentVideos].reverse().map((video) => ({
    key: video.id,
    value: video.viewCount,
    axis: formatShortDate(video.publishedAt),
    detail: `${video.title}, ${formatShortDate(video.publishedAt)}`,
  }));
  const averageViews = momentum ? momentum.recent : recentVideos.length > 0 ? recentVideos.reduce((sum, v) => sum + v.viewCount, 0) / recentVideos.length : 0;

  return (
    <div className={`grid gap-4 ${split.grid}`}>
      <Feature
        id="mentions"
        icon={<MessagesSquare className="size-4" strokeWidth={2} />}
        source={hn ? `Hacker News mentions of “${hn.query}”` : 'Hacker News mentions'}
        range={weeks.length >= 2 ? `Last ${weeks.length} weeks` : undefined}
        className={split.wide}
        figure={
          week ? (
            <>
              <Figure value={formatCount(week.current)} unit="mentions this week" />
              {week.change !== null && <DeltaPill change={week.change} context="the week before" />}
            </>
          ) : undefined
        }
      >
        {weeks.length >= 2 ? (
          <TrendLine points={weeks} unit="mentions" summary={`Hacker News mentions of ${hn?.query} per week, oldest first`} Frame={Frame} height={PLOT_HEIGHT} />
        ) : (
          <Gap source="Hacker News" status={stats.sources.hackerNews} hint="Add a search term." links={links} />
        )}
      </Feature>

      <Feature
        id="views"
        icon={<SquarePlay className="size-4" strokeWidth={2} />}
        source="YouTube views per video"
        range={videos.length > 0 ? `Last ${videos.length} videos` : undefined}
        className={split.narrow}
        figure={
          videos.length > 0 ? (
            <>
              <Figure
                value={formatFigure(Math.round(averageViews))}
                title={formatCount(Math.round(averageViews))}
                unit={momentum ? `avg, last ${momentum.span} videos` : 'avg per video'}
              />
              {momentum && momentum.change !== null && <DeltaPill change={momentum.change} context={`the ${momentum.span} videos before`} />}
            </>
          ) : undefined
        }
      >
        {videos.length > 0 ? (
          <TrendColumns points={videos} emphasis={videos.length - 1} unit="views" summary="Views on your recent videos, oldest first" Frame={Frame} height={PLOT_HEIGHT} />
        ) : (
          <Gap source="YouTube" status={stats.sources.youtube} hint="Add your channel ID." links={links} />
        )}
      </Feature>
    </div>
  );
}
