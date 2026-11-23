import { z } from 'zod';
import { parseGithubUsername, parseYoutubeChannel } from './source-identifiers.js';

/**
 * The PATCH /saas/settings body and the database update it makes. Pure (no
 * environment, no database), so it is unit-tested on its own.
 *
 * A source left out of the body is unchanged; an empty string disconnects
 * it. Previously an empty string was rejected and the settings form left
 * cleared fields out, so a connected source could never be removed.
 *
 * Unknown keys are stripped by the schema, so only these three fields can
 * ever be written here (never, say, subscriptionStatus).
 */
// Long enough for a pasted profile or channel link (stored shortened); the
// search term goes to Hacker News's search as typed, so it stays short.
const sourceField = (max: number) => z.string().max(max, { error: `Use at most ${max} characters.` }).optional();

export const updateSettingsBodySchema = z.object({
  githubUsername: sourceField(200),
  youtubeChannelId: sourceField(200),
  brandSearchQuery: sourceField(100),
});

export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;

export interface SettingsUpdate {
  $set?: Record<string, string>;
  $unset?: Record<string, ''>;
}

/**
 * How a value is stored: a pasted GitHub link or @name as the bare username,
 * a YouTube link as its @handle or channel ID (source-identifiers.ts), so
 * the dashboard shows "octocat", not the link. Other text is kept as typed.
 */
function stored(field: string, value: string): string {
  const text = value.trim();
  if (field === 'githubUsername') return parseGithubUsername(text);
  if (field === 'youtubeChannelId') {
    const ref = parseYoutubeChannel(text);
    if (ref && 'id' in ref) return ref.id;
    if (ref && 'handle' in ref) return `@${ref.handle}`;
  }
  return text;
}

/** $set for each value given, $unset for each field cleared to an empty string. */
export function settingsUpdate(body: UpdateSettingsBody): SettingsUpdate {
  const $set: Record<string, string> = {};
  const $unset: Record<string, ''> = {};
  for (const [field, value] of Object.entries(body)) {
    if (value === undefined) continue;
    const clean = value.trim() === '' ? '' : stored(field, value);
    if (clean === '') $unset[field] = '';
    else $set[field] = clean;
  }
  return {
    ...(Object.keys($set).length > 0 ? { $set } : {}),
    ...(Object.keys($unset).length > 0 ? { $unset } : {}),
  };
}
