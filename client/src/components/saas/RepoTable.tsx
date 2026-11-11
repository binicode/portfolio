import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import type { GithubRepoSummary } from '@/types/saas';
import { formatCount, formatTimeAgo } from './format';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Activity status from GitHub's own fields: archived flag and last push. */
function repoStatus(repo: GithubRepoSummary, now: number): { label: string; variant: BadgeVariant } {
  if (repo.archived) return { label: 'Archived', variant: 'muted' };
  if (!repo.pushedAt) return { label: 'Empty', variant: 'muted' };
  const days = (now - new Date(repo.pushedAt).getTime()) / DAY_MS;
  if (days <= 30) return { label: 'Active', variant: 'success' };
  if (days <= 180) return { label: 'Quiet', variant: 'muted' };
  return { label: 'Dormant', variant: 'muted' };
}

const TH = 'label px-3 py-3 font-normal text-muted-foreground first:pl-5 last:pr-5';
const NUM = 'px-3 py-3.5 text-right tabular-nums';

interface RepoTableProps {
  repos: GithubRepoSummary[];
  /** Render time, passed in so the component stays pure. */
  now: number;
}

/**
 * Repositories by stars. Status reads GitHub's archived flag and last push:
 * Active (30 days), Quiet (6 months), Dormant (older). On narrow screens the
 * secondary columns drop out, status moves under the name on phones, and the
 * table can still scroll inside a focusable region if it has to.
 */
export default function RepoTable({ repos, now }: RepoTableProps) {
  return (
    <div role="region" aria-label="Repository table" tabIndex={0} className="overflow-x-auto focus-visible:outline-offset-0">
      <table className="w-full border-collapse text-[0.9375rem]">
        <caption className="sr-only">Public repositories, most stars first, with forks, open issues, last push and status</caption>
        <thead>
          <tr className="border-b border-border text-left">
            <th scope="col" className={TH}>
              Repository
            </th>
            <th scope="col" className={`${TH} hidden md:table-cell`}>
              Language
            </th>
            <th scope="col" className={`${TH} text-right max-sm:pr-5`}>
              Stars
            </th>
            <th scope="col" className={`${TH} hidden text-right md:table-cell`}>
              Forks
            </th>
            <th scope="col" className={`${TH} hidden text-right lg:table-cell`}>
              Issues
            </th>
            <th scope="col" className={`${TH} hidden sm:table-cell`}>
              Last push
            </th>
            <th scope="col" className={`${TH} hidden sm:table-cell`}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {repos.map((repo) => {
            const status = repoStatus(repo, now);
            return (
              <tr key={repo.name} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                <th scope="row" className="max-w-[13rem] py-3.5 pl-5 pr-3 text-left font-normal sm:max-w-[16rem]">
                  <span className="flex items-center gap-2">
                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="truncate font-medium hover:text-accent">
                      {repo.name}
                    </a>
                    {repo.fork && <span className="label shrink-0 text-muted-foreground">Fork</span>}
                  </span>
                  {repo.description && (
                    <span className="mt-0.5 block truncate text-sm text-muted-foreground" title={repo.description}>
                      {repo.description}
                    </span>
                  )}
                  {/* Phones: status and last push move under the name instead of off-screen columns. */}
                  <span className="mt-2 flex items-center gap-2.5 text-sm text-muted-foreground sm:hidden">
                    <Badge variant={status.variant} dot>
                      {status.label}
                    </Badge>
                    {repo.pushedAt && <time dateTime={repo.pushedAt}>{formatTimeAgo(repo.pushedAt, now)}</time>}
                  </span>
                </th>
                <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell">{repo.language ?? '—'}</td>
                <td className={`${NUM} max-sm:pr-5`}>{formatCount(repo.stars)}</td>
                <td className={`${NUM} hidden text-muted-foreground md:table-cell`}>{formatCount(repo.forks)}</td>
                <td className={`${NUM} hidden text-muted-foreground lg:table-cell`}>{formatCount(repo.openIssues)}</td>
                <td className="hidden whitespace-nowrap px-3 py-3.5 text-muted-foreground sm:table-cell">
                  {repo.pushedAt ? <time dateTime={repo.pushedAt}>{formatTimeAgo(repo.pushedAt, now)}</time> : '—'}
                </td>
                <td className="hidden py-3.5 pl-3 pr-5 sm:table-cell">
                  <Badge variant={status.variant} dot>
                    {status.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
