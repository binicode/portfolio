import 'server-only';

const GITHUB_API_BASE = 'https://api.github.com';

export interface GithubActivityItem {
  id: string;
  type: string;
  repoName: string;
  createdAt: string;
  summary: string;
}

interface GithubEventResponse {
  id: string;
  type: string;
  repo: { name: string };
  created_at: string;
}

function summarizeEvent(event: GithubEventResponse): string {
  switch (event.type) {
    case 'PushEvent':
      return `Pushed to ${event.repo.name}`;
    case 'PullRequestEvent':
      return `Opened a pull request in ${event.repo.name}`;
    case 'IssuesEvent':
      return `Opened an issue in ${event.repo.name}`;
    case 'WatchEvent':
      return `Starred ${event.repo.name}`;
    case 'CreateEvent':
      return `Created ${event.repo.name}`;
    case 'ForkEvent':
      return `Forked ${event.repo.name}`;
    default:
      return `Active in ${event.repo.name}`;
  }
}

/**
 * Fetches the site owner's recent public GitHub activity directly
 * from GitHub, server-side only. Deliberately reads process.env
 * directly rather than through the validated clientEnv object — see
 * chat for the reasoning. Fails silently (empty array) rather than
 * throwing, since this is a decorative home page feature, not a
 * critical data path.
 */
export async function getGithubActivity(username: string, limit: number = 5): Promise<GithubActivityItem[]> {
  const token = process.env.GITHUB_API_TOKEN;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events/public`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return [];
    }

    const events = (await response.json()) as GithubEventResponse[];

    return events.slice(0, limit).map((event) => ({
      id: event.id,
      type: event.type,
      repoName: event.repo.name,
      createdAt: event.created_at,
      summary: summarizeEvent(event),
    }));
  } catch {
    return [];
  }
}
