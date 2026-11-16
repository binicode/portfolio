/**
 * Reads what a customer typed into Settings as a GitHub user or a YouTube
 * channel. People paste what they see (a profile link, an @handle), but the
 * providers' APIs want a bare username or a channel ID, so a pasted link or
 * handle used to come back "not found". Pure, so it is unit-tested. Applied
 * when stats are fetched, so values already saved work without migration.
 */

/** "octocat", "@octocat" or "https://github.com/octocat/…" → "octocat". */
export function parseGithubUsername(input: string): string {
  let value = input.trim();
  const link = value.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?#\s]+)/i);
  if (link) value = link[1];
  return value.replace(/^@/, '');
}

export type YoutubeChannelRef = { id: string } | { handle: string } | { username: string };

const CHANNEL_ID = /^UC[\w-]{22}$/;

/**
 * A channel ID ("UC" + 22 characters), an @handle, or a channel link
 * (youtube.com/@handle, /channel/UC…, /user/name, /c/name), possibly
 * without the "@". Null for an empty value.
 */
export function parseYoutubeChannel(input: string): YoutubeChannelRef | null {
  const value = input.trim();
  if (!value) return null;
  if (CHANNEL_ID.test(value)) return { id: value };

  const link = value.match(/^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(.+)$/i);
  if (link) {
    const [first, second] = link[1].split(/[/?#]/);
    if (first === 'channel' && second && CHANNEL_ID.test(second)) return { id: second };
    if (first === 'user' && second) return { username: second };
    if (first === 'c' && second) return { handle: second };
    if (first.startsWith('@') && first.length > 1) return { handle: first.slice(1) };
    return { handle: first };
  }
  return { handle: value.replace(/^@/, '') };
}
