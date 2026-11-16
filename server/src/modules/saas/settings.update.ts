import { z } from 'zod';

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
const sourceField = z.string().optional();

export const updateSettingsBodySchema = z.object({
  githubUsername: sourceField,
  youtubeChannelId: sourceField,
  brandSearchQuery: sourceField,
});

export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;

export interface SettingsUpdate {
  $set?: Record<string, string>;
  $unset?: Record<string, ''>;
}

/** $set for each value given, $unset for each field cleared to an empty string. */
export function settingsUpdate(body: UpdateSettingsBody): SettingsUpdate {
  const $set: Record<string, string> = {};
  const $unset: Record<string, ''> = {};
  for (const [field, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (value.trim() === '') $unset[field] = '';
    else $set[field] = value;
  }
  return {
    ...(Object.keys($set).length > 0 ? { $set } : {}),
    ...(Object.keys($unset).length > 0 ? { $unset } : {}),
  };
}
