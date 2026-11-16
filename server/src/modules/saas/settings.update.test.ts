// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settingsUpdate, updateSettingsBodySchema } from './settings.update.js';

const update = (body: unknown) => settingsUpdate(updateSettingsBodySchema.parse(body));

test('values are set; fields left out are untouched', () => {
  assert.deepEqual(update({ githubUsername: 'octocat' }), { $set: { githubUsername: 'octocat' } });
  assert.deepEqual(update({}), {});
});

test('an empty field disconnects that source', () => {
  assert.deepEqual(update({ githubUsername: 'octocat', youtubeChannelId: '', brandSearchQuery: '  ' }), {
    $set: { githubUsername: 'octocat' },
    $unset: { youtubeChannelId: '', brandSearchQuery: '' },
  });
});

test('only the three source fields can be written', () => {
  assert.deepEqual(update({ subscriptionStatus: 'active', email: 'x@example.com', githubUsername: 'octocat' }), {
    $set: { githubUsername: 'octocat' },
  });
  assert.throws(() => updateSettingsBodySchema.parse({ githubUsername: 42 }));
});
