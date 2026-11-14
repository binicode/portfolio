import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, GitFork, Star } from 'lucide-react';
import type { AggregatorStats, GithubRepoSummary } from '@/types/saas';
import { formatCount, formatFigure, formatTimeAgo } from './format';
import { showcaseRepos } from './insights';

const TILES = 6;

/** A link when the data is real, a plain block in the demo (its URLs are placeholders). */
function Tile({ href, className, children }: { href: string | null; className: string; children: ReactNode }) {
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`group ${className}`}>
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
}

function Arrow({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <ArrowUpRight
      aria-hidden="true"
      strokeWidth={2}
      className="size-3.5 shrink-0 translate-y-0.5 text-muted-foreground opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:text-accent-bright group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
    />
  );
}

function Meta({ repo, stars = true }: { repo: GithubRepoSummary; stars?: boolean }) {
  return (
    <>
      {repo.language && (
        <span className="flex min-w-0 items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground/45" />
          <span className="truncate">{repo.language}</span>
        </span>
      )}
      {stars && (
        <span className="flex items-center gap-1" title={`${formatCount(repo.stars)} stars`}>
          <Star aria-hidden="true" className="size-3" strokeWidth={2} />
          {formatFigure(repo.stars)}
          <span className="sr-only"> stars</span>
        </span>
      )}
      <span className="flex items-center gap-1" title={`${formatCount(repo.forks)} forks`}>
        <GitFork aria-hidden="true" className="size-3" strokeWidth={2} />
        {formatFigure(repo.forks)}
        <span className="sr-only"> forks</span>
      </span>
    </>
  );
}

/**
 * GitHub work as a curated portfolio rather than a table: the most-starred
 * repository as a wide feature (its share of all stars as a thin meter), then
 * compact tiles with name, a two-line description, language, stars and forks.
 * Forks, archived and never-pushed repositories are left out. No borders on
 * the tiles: a quiet fill that lifts on hover, an arrow that slides in on
 * links. Server-rendered, no client JavaScript.
 */
export default function RepoShowcase({ stats, links, className = '' }: { stats: AggregatorStats; links: boolean; className?: string }) {
  const github = stats.github;
  const picked = github ? showcaseRepos(github.repos, TILES + 1) : [];
  const [feature, ...tiles] = picked;
  const now = Date.parse(stats.fetchedAt);
  const share = github && feature && github.totalStars > 0 ? feature.stars / github.totalStars : 0;

  return (
    <section id="repositories" aria-labelledby="repos-title" className={`dash-card @container min-w-0 scroll-mt-6 rounded-xl border border-border bg-card p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div>
          <h2 id="repos-title" className="text-body-lg font-medium">
            Repositories
          </h2>
        </div>
        {github && links && (
          <a
            href={`https://github.com/${encodeURIComponent(github.username)}?tab=repositories`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            All {formatCount(github.publicRepos)} on GitHub ↗
          </a>
        )}
      </div>

      {!github ? (
        <div className="mt-4 text-sm text-muted-foreground">
          {stats.sources.github === 'unavailable' ? (
            <p>GitHub didn’t respond. Refresh to retry.</p>
          ) : (
            <>
              <p>Add your GitHub username.</p>
              {links && (
                <Link href="/saas/dashboard/settings" className="link mt-3 inline-block font-medium text-foreground">
                  Connect GitHub
                </Link>
              )}
            </>
          )}
        </div>
      ) : !feature ? (
        <p className="mt-4 text-sm text-muted-foreground">No public repositories of your own yet.</p>
      ) : (
        <ol className="mt-4 grid gap-2 @lg:grid-cols-2 @3xl:grid-cols-3">
          <li className="@lg:col-span-2 @3xl:col-span-3">
            <Tile
              href={links ? feature.url : null}
              className="repo-feature grid gap-4 rounded-lg p-4 @lg:grid-cols-[minmax(0,1fr)_auto] @lg:items-end sm:p-5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-accent-bright">Most starred</p>
                <p className="mt-1 flex items-center gap-2">
                  <span className="truncate text-lg font-medium tracking-[-0.01em]">{feature.name}</span>
                  <Arrow show={links} />
                </p>
                {feature.description && <p className="mt-1 line-clamp-2 max-w-[42rem] text-sm text-muted-foreground">{feature.description}</p>}
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-micro text-muted-foreground tabular-nums">
                  <Meta repo={feature} stars={false} />
                  {feature.pushedAt && <span>pushed {formatTimeAgo(feature.pushedAt, now)}</span>}
                </p>
              </div>
              <div className="@lg:text-right">
                <p className="text-figure-md font-medium tabular-nums">
                  {formatCount(feature.stars)}
                  <span className="sr-only"> stars</span>
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">{Math.round(share * 100)}% of all your stars</p>
                <span aria-hidden="true" className="mt-2 block h-1 w-36 overflow-hidden rounded-full bg-foreground/10 @lg:ml-auto">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.round(share * 100))}%` }} />
                </span>
              </div>
            </Tile>
          </li>

          {tiles.map((repo, index) => (
            // Single-column (phone) widths show four tiles; two and three columns show all six.
            <li key={repo.name} className={`min-w-0 ${index >= 4 ? '@max-lg:hidden' : ''}`}>
              <Tile href={links ? repo.url : null} className="repo-tile flex h-full flex-col rounded-lg p-3.5">
                <p className="flex items-center justify-between gap-2">
                  <span className="truncate text-body-sm font-medium">{repo.name}</span>
                  <Arrow show={links} />
                </p>
                {repo.description && <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground">{repo.description}</p>}
                <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 font-mono text-micro text-muted-foreground tabular-nums">
                  <Meta repo={repo} />
                </p>
              </Tile>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
