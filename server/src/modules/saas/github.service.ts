import { AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import type { GithubRepoSummary, GithubStats } from './saas.types.js';

const GITHUB_API_BASE = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_REPOS_RETURNED = 20;

interface GithubUserResponse {
  followers: number;
  public_repos: number;
}

interface GithubRepoResponse {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  archived: boolean;
  fork: boolean;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Authenticated requests get 5,000 requests/hour instead of 60/hour
  // shared across every request from this server's IP — a real
  // requirement once more than a couple of subscribers are active,
  // not just an optimization.
  if (env.GITHUB_API_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_API_TOKEN}`;
  }

  return headers;
}

async function fetchRepos(username: string): Promise<GithubRepoResponse[]> {
  // Only the first 100 repos are counted — a deliberate scope limit,
  // not an oversight. Pagination for >100 public repos is genuinely
  // rare for this app's target audience.
  const response = await fetch(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100`,
    { headers: buildHeaders(), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );

  if (!response.ok) {
    throw new AppError(`GitHub repos request failed: ${response.status}`, 502);
  }

  return (await response.json()) as GithubRepoResponse[];
}

function toSummary(repo: GithubRepoResponse): GithubRepoSummary {
  return {
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    pushedAt: repo.pushed_at,
    archived: repo.archived,
    fork: repo.fork,
  };
}

/** Most stars first; ties go to the most recently pushed. */
function byStarsThenRecency(a: GithubRepoResponse, b: GithubRepoResponse): number {
  if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
  return (b.pushed_at ?? '').localeCompare(a.pushed_at ?? '');
}

export async function getGithubStats(username: string): Promise<GithubStats> {
  const userResponse = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
    headers: buildHeaders(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (userResponse.status === 404) {
    throw new AppError(`GitHub user "${username}" not found`, 404);
  }

  if (!userResponse.ok) {
    throw new AppError(`GitHub user request failed: ${userResponse.status}`, 502);
  }

  const user = (await userResponse.json()) as GithubUserResponse;
  const repos = await fetchRepos(username);

  return {
    username,
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
    repos: [...repos].sort(byStarsThenRecency).slice(0, MAX_REPOS_RETURNED).map(toSummary),
  };
}
