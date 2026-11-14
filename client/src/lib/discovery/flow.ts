/**
 * Project discovery: a short, adaptive questionnaire a prospective client
 * answers by picking options. The questions are fixed data, not generated,
 * so each one appears instantly and its options are always valid; the AI
 * adds short recommendations between them and writes the final brief.
 *
 * Pure and runtime-import free, so it runs under `node --test` directly.
 */

export const OTHER = 'other';
export const NOT_SURE = 'not-sure';
export const SKIPPED = 'skipped';

export interface Option {
  id: string;
  label: string;
}

export type Answers = Record<string, string[]>;
/** Free text typed under "Other", by question id. */
export type OtherText = Record<string, string>;

export interface Question {
  id: string;
  /** Short name for the answer in the brief ("Product: Online store"). */
  label: string;
  /** May depend on earlier answers, so it reads like a conversation. */
  prompt: (answers: Answers) => string;
  options: (answers: Answers) => Option[];
  multiple?: boolean;
  /** For multiple choice: at most this many. */
  max?: number;
  /** Ask only when this holds; irrelevant questions never appear. */
  when?: (answers: Answers) => boolean;
  /** After answering, the assistant adds a short recommendation. */
  insight?: boolean;
  /** Offer "Other" with a short text box. */
  other?: boolean;
  /** Offer "Not sure". */
  notSure?: boolean;
}

const pick = (answers: Answers, id: string) => answers[id] ?? [];
const has = (answers: Answers, id: string, value: string) => pick(answers, id).includes(value);

const BUILD: Option[] = [
  { id: 'web', label: 'Web app' },
  { id: 'mobile', label: 'Mobile app' },
  { id: 'saas', label: 'SaaS platform' },
  { id: 'ecommerce', label: 'Online store' },
  { id: 'ai', label: 'AI-powered product' },
];

const BUILD_NOUN: Record<string, string> = {
  web: 'web app',
  mobile: 'mobile app',
  saas: 'SaaS platform',
  ecommerce: 'store',
  ai: 'AI product',
};

/** "your SaaS platform", or "it" when the type isn't known. */
function subject(answers: Answers): string {
  const noun = BUILD_NOUN[pick(answers, 'build')[0]];
  return noun ? `your ${noun}` : 'it';
}

const ACTIONS_COMMON: Option[] = [
  { id: 'accounts', label: 'Sign up and log in' },
  { id: 'search', label: 'Search and filter' },
  { id: 'dashboard', label: 'See dashboards' },
  { id: 'notify', label: 'Get notifications' },
  { id: 'upload', label: 'Upload files' },
  { id: 'messaging', label: 'Message each other' },
];

const ACTIONS_BY_BUILD: Record<string, Option[]> = {
  ecommerce: [
    { id: 'browse', label: 'Browse products' },
    { id: 'checkout', label: 'Check out' },
    { id: 'orders', label: 'Track orders' },
  ],
  saas: [
    { id: 'subscribe', label: 'Subscribe to a plan' },
    { id: 'teams', label: 'Invite a team' },
    { id: 'admin', label: 'Manage it in an admin panel' },
  ],
  ai: [
    { id: 'chat', label: 'Ask questions in chat' },
    { id: 'generate', label: 'Generate content' },
    { id: 'analyse', label: 'Analyse documents' },
  ],
  web: [
    { id: 'book', label: 'Book or schedule' },
    { id: 'content', label: 'Read or publish content' },
  ],
  mobile: [
    { id: 'book', label: 'Book or schedule' },
    { id: 'location', label: 'Use their location' },
  ],
};

/** What users can do, led by what's typical for this kind of product. */
export function actionOptions(answers: Answers): Option[] {
  const specific = ACTIONS_BY_BUILD[pick(answers, 'build')[0]] ?? [];
  const seen = new Set(specific.map((option) => option.id));
  return [...specific, ...ACTIONS_COMMON.filter((option) => !seen.has(option.id))].slice(0, 8);
}

/** The chosen actions, as options for "which matter most". */
function chosenActions(answers: Answers): Option[] {
  const all = actionOptions(answers);
  return pick(answers, 'actions')
    .map((id) => all.find((option) => option.id === id))
    .filter((option): option is Option => Boolean(option));
}

export const QUESTIONS: readonly Question[] = [
  {
    id: 'build',
    label: 'Product',
    prompt: () => 'What are you building?',
    options: () => BUILD,
    other: true,
    notSure: true,
  },
  {
    id: 'stage',
    label: 'Stage',
    prompt: () => 'Where are you now?',
    options: () => [
      { id: 'idea', label: 'Just an idea' },
      { id: 'planning', label: 'Planning it' },
      { id: 'live', label: 'It’s live' },
      { id: 'improve', label: 'Improving an existing app' },
    ],
    insight: true,
  },
  {
    id: 'stack',
    label: 'Built with',
    prompt: () => 'What is it built with?',
    options: () => [
      { id: 'react', label: 'React or Next.js' },
      { id: 'node', label: 'Node.js' },
      { id: 'wordpress', label: 'WordPress' },
      { id: 'shopify', label: 'Shopify' },
      { id: 'native', label: 'Native mobile' },
    ],
    multiple: true,
    other: true,
    notSure: true,
    when: (answers) => has(answers, 'stage', 'live') || has(answers, 'stage', 'improve'),
  },
  {
    id: 'problem',
    label: 'Solves',
    prompt: (answers) => `What should ${subject(answers)} solve?`,
    options: () => [
      { id: 'automate', label: 'Replace manual work' },
      { id: 'sell', label: 'Sell products or services' },
      { id: 'organise', label: 'Organise data or content' },
      { id: 'connect', label: 'Connect people' },
      { id: 'insight', label: 'Turn data into insight' },
    ],
    multiple: true,
    other: true,
  },
  {
    id: 'users',
    label: 'Users',
    prompt: () => 'Who will use it?',
    options: () => [
      { id: 'consumers', label: 'Consumers' },
      { id: 'businesses', label: 'Businesses' },
      { id: 'both', label: 'Both' },
      { id: 'team', label: 'My own team' },
    ],
    notSure: true,
  },
  {
    id: 'actions',
    label: 'Users can',
    prompt: () => 'What should users be able to do?',
    options: actionOptions,
    multiple: true,
    other: true,
  },
  {
    id: 'priorities',
    label: 'Launch priorities',
    prompt: () => 'Which matter most at launch?',
    options: chosenActions,
    multiple: true,
    max: 3,
    // Only worth asking when there's something to choose between.
    when: (answers) => chosenActions(answers).length > 3,
  },
  {
    id: 'integrations',
    label: 'Integrations',
    prompt: () => 'Does it need any of these?',
    options: (answers) =>
      [
        { id: 'payments', label: 'Payments' },
        { id: 'ai', label: 'AI features' },
        { id: 'apis', label: 'Third-party APIs' },
        { id: 'email', label: 'Email or SMS' },
        { id: 'maps', label: 'Maps' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'none', label: 'None of these' },
      ].filter((option) => !(option.id === 'ai' && has(answers, 'build', 'ai'))),
    multiple: true,
    other: true,
    notSure: true,
    insight: true,
  },
  {
    id: 'budget',
    label: 'Budget',
    prompt: () => 'What’s your budget?',
    options: () => [
      { id: 'lt5k', label: 'Under $5k' },
      { id: '5-15k', label: '$5k – $15k' },
      { id: '15-50k', label: '$15k – $50k' },
      { id: 'gt50k', label: '$50k+' },
    ],
    notSure: true,
  },
  {
    id: 'timeline',
    label: 'Launch',
    prompt: () => 'When would you like to launch?',
    options: () => [
      { id: 'asap', label: 'Within a month' },
      { id: '1-3m', label: 'In 1–3 months' },
      { id: '3-6m', label: 'In 3–6 months' },
      { id: 'flexible', label: 'Flexible' },
    ],
  },
];

/** The questions that apply, given the answers so far, in order. */
export function activeQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((question) => !question.when || question.when(answers));
}

/** The first unanswered question that applies, or null when discovery is done. */
export function nextQuestion(answers: Answers): Question | null {
  return activeQuestions(answers).find((question) => !(question.id in answers)) ?? null;
}

/** "3 of 9": the current step and the total for this path (the total moves as answers change it). */
export function progress(answers: Answers): { step: number; total: number; done: boolean } {
  const active = activeQuestions(answers);
  const answered = active.filter((question) => question.id in answers).length;
  const done = answered === active.length;
  return { step: done ? active.length : answered + 1, total: active.length, done };
}

/**
 * Records an answer and drops everything after it: earlier answers can
 * change which questions follow (and their options), so later ones are
 * asked again rather than kept stale.
 */
export function answer(answers: Answers, questionId: string, values: string[]): Answers {
  const order = QUESTIONS.map((question) => question.id);
  const position = order.indexOf(questionId);
  const next: Answers = {};
  for (const id of order.slice(0, position)) if (id in answers) next[id] = answers[id];
  next[questionId] = values;
  return next;
}

/** Reopens an earlier question to change it: keeps only the answers before it. */
export function rewind(answers: Answers, questionId: string): Answers {
  const order = QUESTIONS.map((question) => question.id);
  const position = order.indexOf(questionId);
  if (position === -1) return answers;
  const next: Answers = {};
  for (const id of order.slice(0, position)) if (id in answers) next[id] = answers[id];
  return next;
}

/** Steps back to the question before the current one; returns the answers without it. */
export function back(answers: Answers): Answers {
  const answered = activeQuestions(answers).filter((question) => question.id in answers);
  const last = answered[answered.length - 1];
  if (!last) return answers;
  const next = { ...answers };
  delete next[last.id];
  return next;
}

/** A readable label for an answer: option labels, "Other: …", "Not sure", "Skipped". */
export function describe(question: Question, values: string[], answers: Answers, other: OtherText = {}): string[] {
  const options = question.options(answers);
  return values.map((value) => {
    if (value === OTHER) return other[question.id] ? `Other: ${other[question.id]}` : 'Other';
    if (value === NOT_SURE) return 'Not sure';
    if (value === SKIPPED) return 'Skipped';
    return options.find((option) => option.id === value)?.label ?? value;
  });
}

/**
 * The conversation so far as plain question/answer pairs, for the AI. It
 * never sees option ids, only what the client saw and chose.
 */
export function transcript(answers: Answers, other: OtherText = {}): Array<{ q: string; a: string[] }> {
  return activeQuestions(answers)
    .filter((question) => question.id in answers)
    .map((question) => ({ q: question.prompt(answers), a: describe(question, answers[question.id], answers, other) }));
}

/**
 * Built-in recommendations, shown when the AI is slow or unavailable, so the
 * flow never stalls. Short, specific to the answers, and true for this
 * stack.
 */
export function fallbackInsight(questionId: string, answers: Answers): string {
  const build = pick(answers, 'build')[0];
  if (questionId === 'stage') {
    if (has(answers, 'stage', 'idea')) return 'Start with the smallest version that proves the idea: one core flow, real users, then grow.';
    if (has(answers, 'stage', 'improve') || has(answers, 'stage', 'live'))
      return 'An audit comes first: what to keep, what to fix, and what’s worth rebuilding.';
    if (build === 'mobile') return 'A responsive web app or PWA often reaches users faster than native, with one codebase.';
    return 'A clear scope for the first release keeps cost and timeline predictable.';
  }
  if (questionId === 'integrations') {
    const picks = pick(answers, 'integrations');
    if (picks.includes('payments')) return 'Stripe Checkout with verified webhooks keeps payments secure without handling card data.';
    if (picks.includes('ai')) return 'AI features work best grounded in your own data, with a fallback when the model is busy.';
    if (picks.includes('apis')) return 'Each external API gets timeouts and its own failure path, so one outage never takes the app down.';
    return 'A server-rendered Next.js app with a Node API and MongoDB fits this well and stays fast.';
  }
  return '';
}

export type BriefBlock = { kind: 'heading'; text: string } | { kind: 'list'; items: string[] } | { kind: 'text'; text: string };

/**
 * Reads the brief's light markdown (## headings, - items, plain lines) into
 * blocks to render as elements, never as HTML. Stray emphasis is dropped.
 */
export function parseBrief(text: string): BriefBlock[] {
  const blocks: BriefBlock[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\*\*|__/g, '').trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      blocks.push({ kind: 'heading', text: line.replace(/^#+\s*/, '') });
    } else if (/^[-*•]\s+/.test(line)) {
      const item = line.replace(/^[-*•]\s+/, '');
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'list') last.items.push(item);
      else blocks.push({ kind: 'list', items: [item] });
    } else {
      blocks.push({ kind: 'text', text: line });
    }
  }
  return blocks;
}

/**
 * The brief when the AI can't write one: the answers, grouped the same way
 * as the AI brief (## headings, - lines), with open questions listed last.
 */
export function fallbackBrief(answers: Answers, other: OtherText = {}): string {
  const answered = activeQuestions(answers).filter((question) => question.id in answers);
  const isOpen = (question: Question) => answers[question.id].every((value) => value === NOT_SURE || value === SKIPPED);
  const lines = [
    '## Your answers',
    ...answered
      .filter((question) => !isOpen(question))
      .map((question) => `- ${question.label}: ${describe(question, answers[question.id], answers, other).join(', ')}`),
  ];
  const open = answered.filter(isOpen);
  if (open.length) lines.push('', '## To decide', ...open.map((question) => `- ${question.label}`));
  return lines.join('\n');
}

/**
 * When an answer is changed, the questions after it are asked again (their
 * options can depend on it). This returns the earlier pick for a question,
 * kept only where it is still a valid choice, so it can be preselected.
 */
export function recall(question: Question, answers: Answers, previous: Answers): string[] {
  const valid = new Set(question.options(answers).map((option) => option.id));
  if (question.other) valid.add(OTHER);
  if (question.notSure) valid.add(NOT_SURE);
  const values = (previous[question.id] ?? []).filter((value) => valid.has(value));
  return question.max ? values.slice(0, question.max) : values;
}
