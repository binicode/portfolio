import { AppError } from '../../core/middleware/errorHandler.js';
import { env } from '../../core/config/env.js';
import type { GithubStats } from './saas.types.js';

const GITHUB_API_BASE = 'https://api.github.com';

interface GithubUserResponse {
  followers: number;
  public_repos: number;
}

interface GithubRepoResponse {
  stargazers_count: number;
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

async function fetchTotalStars(username: string): Promise<number> {
  // Only the first 100 repos are counted — a deliberate scope limit,
  // not an oversight. Pagination for >100 public repos is genuinely
  // rare for this app's target audience.
  const response = await fetch(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100`,
    { headers: buildHeaders() },
  );

  if (!response.ok) {
    throw new AppError(`GitHub repos request failed: ${response.status}`, 502);
  }

  const repos = (await response.json()) as GithubRepoResponse[];
  return repos.reduce((total, repo) => total + repo.stargazers_count, 0);
}

export async function getGithubStats(username: string): Promise<GithubStats> {
  const userResponse = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}`, {
    headers: buildHeaders(),
  });

  if (userResponse.status === 404) {
    throw new AppError(`GitHub user "${username}" not found`, 404);
  }

  if (!userResponse.ok) {
    throw new AppError(`GitHub user request failed: ${userResponse.status}`, 502);
  }

  const user = (await userResponse.json()) as GithubUserResponse;
  const totalStars = await fetchTotalStars(username);

  return {
    username,
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars,
  };
}
