import type { ReactNode } from 'react';
import Link from 'next/link';
import MetricTile from './MetricTile';
import ColumnSpark from './charts/ColumnSpark';
import LineSpark from './charts/LineSpark';
import RepoTable from './RepoTable';
import MentionsList from './MentionsList';
import { formatShortDate } from './format';
import type { AggregatorStats, SourceStatus } from '@/types/saas';

const CHART_COLUMNS = 8;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function Note({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** Message for a card whose source isn't there: connect it, or wait for it. */
function SourceGap({ source, status, hint }: { source: string; status: SourceStatus; hint: string }) {
  if (status === 'unavailable') {
    return <Note>{source} didn’t respond, so this is empty for now. It returns on the next refresh.</Note>;
  }
  return (
    <div>
      <Note>{hint}</Note>
      <Link href="/saas/dashboard/settings" className="link mt-4 inline-block text-sm font-medium">
        Connect {source}
      </Link>
    </div>
  );
}

function GithubTile({ stats }: { stats: AggregatorStats }) {
  const github = stats.github;
  const top = github?.repos.slice(0, CHART_COLUMNS) ?? [];
  return (
    <MetricTile
      source="GitHub"
      status={stats.sources.github}
      connectHint="Add your GitHub username to see stars, followers and repositories."
      metric={github ? { label: 'Total stars', value: github.totalStars } : undefined}
      secondary={
        github
          ? [
              { label: 'Followers', value: github.followers },
              { label: 'Public repos', value: github.publicRepos },
            ]
          : []
      }
      caption={top.some((repo) => repo.stars > 0) ? `Stars, top ${top.length} repositories` : undefined}
    >
      {top.some((repo) => repo.stars > 0) ? (
        <ColumnSpark
          data={top.map((repo) => ({ key: repo.name, label: repo.name, value: repo.stars }))}
          emphasis={0}
          summary={`Stars on your top ${top.length} repositories, most first`}
          unit="stars"
        />
      ) : (
        <Note>No stars yet across your public repositories.</Note>
      )}
    </MetricTile>
  );
}

function YoutubeTile({ stats, className }: { stats: AggregatorStats; className?: string }) {
  const youtube = stats.youtube;
  const videos = [...(youtube?.recentVideos ?? [])].reverse();
  return (
    <MetricTile
      source="YouTube"
      status={stats.sources.youtube}
      connectHint="Add your YouTube channel ID to see subscribers and views."
      metric={youtube ? { label: 'Subscribers', value: youtube.subscriberCount } : undefined}
      secondary={
        youtube
          ? [
              { label: 'Total views', value: youtube.viewCount },
              { label: 'Videos', value: youtube.videoCount },
            ]
          : []
      }
      caption={videos.length > 0 ? `Views, last ${videos.length} videos` : undefined}
      className={className}
    >
      {videos.length > 0 ? (
        <ColumnSpark
          data={videos.map((video) => ({
            key: video.id,
            label: video.title,
            detail: formatShortDate(video.publishedAt),
            value: video.viewCount,
          }))}
          emphasis={videos.length - 1}
          summary={`Views on your last ${videos.length} videos, oldest first`}
          unit="views"
          axis={{ start: formatShortDate(videos[0].publishedAt), end: formatShortDate(videos[videos.length - 1].publishedAt) }}
        />
      ) : (
        <Note>No recent uploads to chart.</Note>
      )}
    </MetricTile>
  );
}

function HackerNewsTile({ stats, className }: { stats: AggregatorStats; className?: string }) {
  const hn = stats.hackerNews;
  const weekly = hn?.weekly ?? [];
  const hasWeeks = weekly.length >= 2;
  const current = hasWeeks ? weekly[weekly.length - 1].count : 0;
  const change = hasWeeks ? current - weekly[weekly.length - 2].count : 0;

  return (
    <MetricTile
      source="Hacker News"
      status={stats.sources.hackerNews}
      connectHint="Add a search term to track Hacker News mentions."
      metric={
        hn ? (hasWeeks ? { label: 'Mentions, last 7 days', value: current } : { label: 'Mentions, all time', value: hn.mentionCount }) : undefined
      }
      delta={
        hasWeeks
          ? { text: change === 0 ? 'Same as previous week' : `${change > 0 ? '+' : '−'}${Math.abs(change).toLocaleString('en-US')} vs previous week`, positive: change > 0 }
          : null
      }
      secondary={
        hn && hasWeeks
          ? [
              { label: 'Last 8 weeks', value: weekly.reduce((sum, week) => sum + week.count, 0) },
              { label: 'All time', value: hn.mentionCount },
            ]
          : []
      }
      caption={hn && hasWeeks ? `Mentions of “${hn.query}” per week` : undefined}
      className={className}
    >
      {hasWeeks ? (
        <LineSpark
          data={weekly.map((week) => {
            const end = new Date(new Date(week.weekStart).getTime() + WEEK_MS).toISOString();
            return { key: week.weekStart, label: `${formatShortDate(week.weekStart)} – ${formatShortDate(end)}`, value: week.count };
          })}
          summary={`Weekly Hacker News mentions of ${hn?.query}, oldest week first`}
          unit="mentions"
          axis={{ start: formatShortDate(weekly[0].weekStart), end: 'Today' }}
        />
      ) : (
        <Note>Weekly counts are unavailable right now.</Note>
      )}
    </MetricTile>
  );
}

interface DashboardBodyProps {
  stats: AggregatorStats;
  /**
   * The marketing replica: fewer rows, and the secondary panels drop out on
   * small screens so the preview stays a preview. Same components as the
   * real dashboard, so it can't drift from what subscribers see.
   */
  preview?: boolean;
}

/** The Creator Dashboard below its heading: metric row, repositories table, latest mentions. */
export default function DashboardBody({ stats, preview = false }: DashboardBodyProps) {
  // Relative dates ("3 days ago") are measured from when the data was fetched.
  const now = new Date(stats.fetchedAt).getTime();
  const github = stats.github;
  const hn = stats.hackerNews;
  const tableRows = preview ? 4 : 10;
  const mentions = hn?.recentMentions.slice(0, preview ? 3 : undefined) ?? [];

  return (
    <>
      {/* Metric row: one tile per source. */}
      <div
        className={
          preview
            ? 'grid gap-3 sm:grid-cols-3'
            : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1'
        }
      >
        <GithubTile stats={stats} />
        <YoutubeTile stats={stats} className={preview ? 'hidden sm:flex' : undefined} />
        <HackerNewsTile stats={stats} className={preview ? 'hidden sm:flex' : undefined} />
      </div>

      <div className={`grid ${preview ? 'mt-3 gap-3 lg:grid-cols-12' : 'mt-4 gap-4 xl:grid-cols-12'} items-start`}>
        <section
          aria-labelledby="repos-title"
          className={`min-w-0 rounded-md border border-border bg-card ${preview ? 'lg:col-span-8' : 'xl:col-span-8'}`}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border p-5">
            <div>
              <h2 id="repos-title" className="text-h3 font-medium">
                Repositories
              </h2>
              {github && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Top {Math.min(github.repos.length, tableRows)} of {github.publicRepos.toLocaleString('en-US')} public
                  repositories, by stars
                </p>
              )}
            </div>
            {github && (
              <a
                href={`https://github.com/${encodeURIComponent(github.username)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="label text-muted-foreground hover:text-foreground"
              >
                Open GitHub ↗
              </a>
            )}
          </div>
          {github && github.repos.length > 0 ? (
            <RepoTable repos={github.repos.slice(0, tableRows)} now={now} />
          ) : (
            <div className="p-5">
              {github ? (
                <Note>No public repositories yet.</Note>
              ) : (
                <SourceGap source="GitHub" status={stats.sources.github} hint="Add your GitHub username to list your repositories here." />
              )}
            </div>
          )}
        </section>

        <section
          aria-labelledby="mentions-title"
          className={`min-w-0 rounded-md border border-border bg-card p-5 ${preview ? 'hidden lg:col-span-4 lg:block' : 'xl:col-span-4'}`}
        >
          <h2 id="mentions-title" className="text-h3 font-medium">
            Latest on Hacker News
          </h2>
          {hn && <p className="mt-1 text-sm text-muted-foreground">Newest mentions of “{hn.query}”</p>}
          <div className="mt-5 border-t border-border pt-5">
            {mentions.length > 0 ? (
              <MentionsList mentions={mentions} now={now} />
            ) : hn ? (
              <Note>No mentions of “{hn.query}” yet.</Note>
            ) : (
              <SourceGap source="Hacker News" status={stats.sources.hackerNews} hint="Add a search term to follow mentions here." />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
