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

test('pasted links and @names are stored in clean form', () => {
  assert.deepEqual(update({ githubUsername: 'https://github.com/octocat/', youtubeChannelId: 'https://www.youtube.com/@GoogleDevelopers', brandSearchQuery: ' Next.js ' }), {
    $set: { githubUsername: 'octocat', youtubeChannelId: '@GoogleDevelopers', brandSearchQuery: 'Next.js' },
  });
  assert.deepEqual(update({ githubUsername: '@octocat', youtubeChannelId: 'youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw' }), {
    $set: { githubUsername: 'octocat', youtubeChannelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' },
  });
});

test('only the three source fields can be written', () => {
  assert.deepEqual(update({ subscriptionStatus: 'active', email: 'x@example.com', githubUsername: 'octocat' }), {
    $set: { githubUsername: 'octocat' },
  });
  assert.throws(() => updateSettingsBodySchema.parse({ githubUsername: 42 }));
});
