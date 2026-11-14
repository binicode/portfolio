// Run with `npm test` (Node's built-in test runner; TypeScript types are stripped natively).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOT_SURE,
  OTHER,
  SKIPPED,
  actionOptions,
  activeQuestions,
  answer,
  back,
  describe,
  fallbackBrief,
  fallbackInsight,
  nextQuestion,
  parseBrief,
  progress,
  recall,
  rewind,
  transcript,
  type Answers,
} from './flow.ts';

const ids = (answers: Answers) => activeQuestions(answers).map((question) => question.id);

test('starts with what is being built, and the prompt adapts to it', () => {
  assert.equal(nextQuestion({})?.id, 'build');
  const problem = activeQuestions({ build: ['saas'] }).find((question) => question.id === 'problem');
  assert.equal(problem?.prompt({ build: ['saas'] }), 'What should your SaaS platform solve?');
  assert.equal(problem?.prompt({ build: [NOT_SURE] }), 'What should it solve?');
});

test('irrelevant questions are skipped: no stack question for an idea, no priorities for few actions', () => {
  assert.ok(!ids({ build: ['web'], stage: ['idea'] }).includes('stack'));
  assert.ok(ids({ build: ['web'], stage: ['improve'] }).includes('stack'));
  assert.ok(!ids({ build: ['web'], stage: ['idea'], actions: ['accounts', 'search'] }).includes('priorities'));
  assert.ok(ids({ build: ['web'], stage: ['idea'], actions: ['accounts', 'search', 'dashboard', 'notify'] }).includes('priorities'));
});

test('options adapt: store actions for a store, no "AI features" when the product is AI', () => {
  assert.deepEqual(actionOptions({ build: ['ecommerce'] }).slice(0, 3).map((option) => option.id), ['browse', 'checkout', 'orders']);
  const integrations = activeQuestions({ build: ['ai'] }).find((question) => question.id === 'integrations');
  assert.ok(!integrations?.options({ build: ['ai'] }).some((option) => option.id === 'ai'));
});

test('progress counts the questions on this path, and finishes', () => {
  // 8 to start; the stack question joins for an existing app, priorities when 4+ actions are chosen.
  assert.deepEqual(progress({}), { step: 1, total: 8, done: false });
  assert.equal(progress({ build: ['web'], stage: ['improve'] }).total, 9);
  assert.equal(progress({ build: ['web'], stage: ['idea'], problem: ['sell'], users: ['team'], actions: ['accounts', 'search', 'dashboard', 'notify'] }).total, 9);
  let answers: Answers = {};
  for (let question = nextQuestion(answers); question; question = nextQuestion(answers)) {
    answers = answer(answers, question.id, [question.options(answers)[0]?.id ?? SKIPPED]);
  }
  assert.equal(progress(answers).done, true);
});

test('changing an earlier answer drops the later ones; back steps one question', () => {
  const answers: Answers = { build: ['web'], stage: ['idea'], problem: ['sell'] };
  assert.deepEqual(answer(answers, 'stage', ['improve']), { build: ['web'], stage: ['improve'] });
  assert.deepEqual(back(answers), { build: ['web'], stage: ['idea'] });
  assert.deepEqual(back({}), {});
});

test('describe and transcript speak in labels, with Other text, Not sure and Skipped', () => {
  const answers: Answers = { build: [OTHER], stage: ['idea'], problem: [NOT_SURE], users: [SKIPPED] };
  const build = activeQuestions(answers)[0];
  assert.deepEqual(describe(build, [OTHER], answers, { build: 'A booking kiosk' }), ['Other: A booking kiosk']);
  assert.deepEqual(transcript(answers, { build: 'A booking kiosk' }), [
    { q: 'What are you building?', a: ['Other: A booking kiosk'] },
    { q: 'Where are you now?', a: ['Just an idea'] },
    { q: 'What should it solve?', a: ['Not sure'] },
    { q: 'Who will use it?', a: ['Skipped'] },
  ]);
});

test('rewind reopens a question and keeps only what came before it', () => {
  const answers: Answers = { build: ['web'], stage: ['idea'], problem: ['sell'], users: ['team'] };
  assert.deepEqual(rewind(answers, 'problem'), { build: ['web'], stage: ['idea'] });
  assert.equal(nextQuestion(rewind(answers, 'problem'))?.id, 'problem');
  assert.deepEqual(rewind(answers, 'nope'), answers);
});

test('the fallback brief lists answers by label, and open questions under To decide', () => {
  const brief = fallbackBrief({ build: ['saas'], stage: ['idea'], problem: [NOT_SURE], users: [SKIPPED] });
  assert.equal(brief, '## Your answers\n- Product: SaaS platform\n- Stage: Just an idea\n\n## To decide\n- Solves\n- Users');
});

test('recall preselects an earlier pick only while it is still a valid choice', () => {
  const actions = activeQuestions({ build: ['saas'] }).find((question) => question.id === 'actions')!;
  const previous: Answers = { actions: ['checkout', 'search', OTHER, SKIPPED] };
  // "Check out" was a store option; for a SaaS platform only "Search and filter" and Other still apply.
  assert.deepEqual(recall(actions, { build: ['saas'] }, previous), ['search', OTHER]);
  assert.deepEqual(recall(actions, { build: ['saas'] }, {}), []);
});

test('parseBrief reads headings, grouped list items and lines, without markup', () => {
  assert.deepEqual(parseBrief('## Project\n- A **booking** app\n* Two roles\n\nPlain line\n### Next'), [
    { kind: 'heading', text: 'Project' },
    { kind: 'list', items: ['A booking app', 'Two roles'] },
    { kind: 'text', text: 'Plain line' },
    { kind: 'heading', text: 'Next' },
  ]);
  // Mid-stream text parses without throwing.
  assert.deepEqual(parseBrief('## Pro'), [{ kind: 'heading', text: 'Pro' }]);
});

test('fallback insights are specific to the answers', () => {
  assert.match(fallbackInsight('stage', { build: ['web'], stage: ['idea'] }), /smallest version/);
  assert.match(fallbackInsight('integrations', { integrations: ['payments'] }), /Stripe/);
  assert.equal(fallbackInsight('budget', {}), '');
});
