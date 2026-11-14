// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatChange,
  mentionMomentum,
  niceMax,
  recentActivity,
  repoInsights,
  repoStatus,
  showcaseRepos,
  sourceSummary,
  videoMomentum,
  weekOverWeek,
} from './insights.ts';
import { initials } from './format.ts';
import type { GithubRepoSummary } from '@/types/saas';

const NOW = Date.UTC(2026, 10, 10, 12);
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

function repo(name: string, stars: number, pushedDaysAgo: number | null, archived = false): GithubRepoSummary {
  return {
    name,
    url: `https://github.com/example/${name}`,
    description: null,
    language: null,
    stars,
    forks: 0,
    openIssues: 0,
    pushedAt: pushedDaysAgo === null ? null : daysAgo(pushedDaysAgo),
    archived,
    fork: false,
  };
}

test('repoStatus: archived wins, empty without a push, then 30-day and 6-month cut-offs', () => {
  assert.equal(repoStatus(repo('a', 0, 1, true), NOW), 'archived');
  assert.equal(repoStatus(repo('b', 0, null), NOW), 'empty');
  assert.equal(repoStatus(repo('c', 0, 30), NOW), 'active');
  assert.equal(repoStatus(repo('d', 0, 31), NOW), 'quiet');
  assert.equal(repoStatus(repo('e', 0, 180), NOW), 'quiet');
  assert.equal(repoStatus(repo('f', 0, 181), NOW), 'dormant');
});

test('repoInsights: top repository share and status counts', () => {
  const repos = [repo('big', 600, 2), repo('mid', 300, 90), repo('old', 100, 400), repo('gone', 0, 10, true)];
  const insights = repoInsights(repos, 1200, NOW);
  assert.deepEqual(insights.top, { name: 'big', stars: 600, share: 0.5 });
  assert.deepEqual(insights.counts, { active: 1, quiet: 1, dormant: 1, archived: 1, empty: 0 });
  assert.equal(insights.total, 4);
});

test('repoInsights: no top repository when nothing has stars; no division by zero', () => {
  const insights = repoInsights([repo('a', 0, 1)], 0, NOW);
  assert.equal(insights.top, null);
  assert.equal(repoInsights([], 0, NOW).total, 0);
});

test('videoMomentum: newest half against the half before', () => {
  const views = [4210, 2980, 6120, 3340, 2210, 5150, 1880, 2620].map((viewCount) => ({ viewCount }));
  const momentum = videoMomentum(views);
  assert.ok(momentum);
  assert.equal(momentum.span, 4);
  assert.equal(momentum.recent, 4162.5);
  assert.equal(momentum.prior, 2965);
  assert.equal(formatChange(momentum.change ?? 0).text, '+40%');
});

test('videoMomentum: needs four videos; odd counts drop the oldest; zero prior gives no ratio', () => {
  assert.equal(videoMomentum([{ viewCount: 1 }, { viewCount: 2 }, { viewCount: 3 }]), null);
  assert.equal(videoMomentum([10, 10, 5, 5, 999].map((viewCount) => ({ viewCount })))?.prior, 5);
  assert.equal(videoMomentum([10, 10, 0, 0].map((viewCount) => ({ viewCount })))?.change, null);
});

test('mentionMomentum: last half of the weekly series against the half before', () => {
  const weeks = [7, 12, 9, 15, 11, 18, 14, 21].map((count) => ({ count }));
  const momentum = mentionMomentum(weeks);
  assert.deepEqual({ recent: momentum?.recent, prior: momentum?.prior, span: momentum?.span }, { recent: 64, prior: 43, span: 4 });
  assert.equal(formatChange(momentum?.change ?? 0).text, '+49%');
  assert.equal(mentionMomentum([{ count: 3 }]), null);
  assert.equal(mentionMomentum([{ count: 0 }, { count: 4 }])?.change, null);
});

test('showcaseRepos: own live work only, most stars first, ties to the latest push, capped', () => {
  const forked = { ...repo('forked', 900, 1), fork: true };
  const repos = [repo('b', 50, 9), forked, repo('a', 50, 2), repo('top', 70, 30), repo('boxed', 99, 1, true), repo('blank', 80, null)];
  assert.deepEqual(showcaseRepos(repos, 10).map((r) => r.name), ['top', 'a', 'b']);
  assert.equal(showcaseRepos(repos, 2).length, 2);
});

test('weekOverWeek: newest week against the one before; no ratio from zero', () => {
  assert.deepEqual(weekOverWeek([7, 14, 21].map((count) => ({ count }))), { current: 21, previous: 14, change: 0.5 });
  assert.equal(weekOverWeek([{ count: 0 }, { count: 4 }])?.change, null);
  assert.equal(weekOverWeek([{ count: 4 }]), null);
});

test('recentActivity: merges sources newest first, skips archived and never-pushed repos, honours the limit', () => {
  const stats = {
    github: {
      username: 'u',
      followers: 0,
      publicRepos: 3,
      totalStars: 10,
      repos: [repo('fresh', 5, 1), repo('stale', 3, 40), repo('boxed', 2, 0, true), repo('blank', 0, null)],
    },
    youtube: { channelId: 'c', subscriberCount: 1, viewCount: 1, videoCount: 1, recentVideos: [{ id: 'v1', title: 'Clip', publishedAt: daysAgo(3), viewCount: 99 }] },
    hackerNews: {
      query: 'q',
      mentionCount: 1,
      recentTitles: [],
      weekly: [],
      recentMentions: [{ title: 'Show HN', url: 'https://news.ycombinator.com/item?id=1', createdAt: daysAgo(0.5), kind: 'story' as const }],
    },
  };
  const feed = recentActivity(stats, 10);
  assert.deepEqual(
    feed.map((item) => `${item.kind}:${item.title}`),
    ['story:Show HN', 'push:fresh', 'video:Clip', 'push:stale'],
  );
  assert.equal(feed[2].views, 99);
  assert.equal(feed[2].url, 'https://www.youtube.com/watch?v=v1');
  assert.equal(recentActivity(stats, 2).length, 2);
  assert.deepEqual(recentActivity({ github: null, youtube: null, hackerNews: null }, 5), []);
});

test('sourceSummary: all live, or which source is missing and why', () => {
  assert.equal(sourceSummary({ github: 'connected', youtube: 'connected', hackerNews: 'connected' }).text, 'All 3 sources are live.');
  assert.equal(
    sourceSummary({ github: 'unavailable', youtube: 'not_connected', hackerNews: 'connected' }).text,
    '1 of 3 sources are live: GitHub didn’t respond and YouTube isn’t connected.',
  );
  assert.equal(sourceSummary({ github: 'connected', youtube: 'not_connected', hackerNews: 'connected' }).live, 2);
});

test('niceMax: a round axis top whose halfway tick is whole', () => {
  assert.equal(niceMax(21), 30);
  assert.equal(niceMax(6120), 8000);
  assert.equal(niceMax(1204), 1600);
  assert.equal(niceMax(20), 20);
  assert.equal(niceMax(3), 4);
  assert.equal(niceMax(0), 1);
});

test('initials: two letters from a dotted name or the first two of a handle', () => {
  assert.equal(initials('jane.doe@example.com'), 'JD');
  assert.equal(initials('creator@example.com'), 'CR');
  assert.equal(initials('octocat'), 'OC');
});

test('formatChange: signs, a true minus and a flat zero', () => {
  assert.deepEqual(formatChange(0.184), { text: '+18%', trend: 'up' });
  assert.deepEqual(formatChange(-0.071), { text: '−7%', trend: 'down' });
  assert.deepEqual(formatChange(0.004), { text: '0%', trend: 'flat' });
});
