// Run with `npm test` in server/ (Node's test runner through tsx).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseGithubUsername, parseYoutubeChannel } from './source-identifiers.js';

test('GitHub: a username, an @name or a profile link', () => {
  for (const input of ['octocat', ' octocat ', '@octocat', 'github.com/octocat', 'https://github.com/octocat', 'https://www.github.com/octocat/', 'https://github.com/octocat?tab=repositories', 'https://github.com/octocat/Spoon-Knife']) {
    assert.equal(parseGithubUsername(input), 'octocat', input);
  }
});

test('YouTube: a channel ID stays an ID', () => {
  assert.deepEqual(parseYoutubeChannel('UC_x5XG1OV2P6uZZ5FSM9Ttw'), { id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' });
  assert.deepEqual(parseYoutubeChannel('https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw'), { id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' });
  assert.deepEqual(parseYoutubeChannel('youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw/videos'), { id: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' });
});

test('YouTube: handles, with or without @, as text or links', () => {
  for (const input of ['@GoogleDevelopers', 'GoogleDevelopers', 'https://www.youtube.com/@GoogleDevelopers', 'https://m.youtube.com/@GoogleDevelopers/videos', 'youtube.com/@GoogleDevelopers?si=abc', 'https://www.youtube.com/c/GoogleDevelopers']) {
    assert.deepEqual(parseYoutubeChannel(input), { handle: 'GoogleDevelopers' }, input);
  }
});

test('YouTube: legacy /user/ links, and nothing for an empty value', () => {
  assert.deepEqual(parseYoutubeChannel('https://www.youtube.com/user/GoogleDevelopers'), { username: 'GoogleDevelopers' });
  assert.equal(parseYoutubeChannel('   '), null);
});
