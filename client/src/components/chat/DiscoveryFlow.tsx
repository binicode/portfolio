'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, Check, Copy, Pencil } from 'lucide-react';
import { streamDiscovery } from '@/lib/ai-chat-client';
import {
  NOT_SURE,
  OTHER,
  SKIPPED,
  activeQuestions,
  answer,
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
  type OtherText,
  type Question,
} from '@/lib/discovery/flow';
import { contactHref } from '@/lib/site';

const STORAGE_KEY = 'assistant-discovery-v1';
/** No first word from the AI within this long: the built-in text shows instead. */
const FIRST_TOKEN_MS = { insight: 4000, brief: 6000 } as const;
const TOTAL_MS = { insight: 12000, brief: 30000 } as const;
/** Choices that stand alone in a multiple-choice answer. */
const EXCLUSIVE = new Set([NOT_SURE, 'none']);
const OTHER_MAX = 120;

type Kind = 'insight' | 'brief';

interface Saved {
  answers: Answers;
  other: OtherText;
  insights: Record<string, string>;
  brief: string;
}

const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === 'string');

function load(): Saved {
  const saved: Saved = { answers: {}, other: {}, insights: {}, brief: '' };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    for (const [id, values] of Object.entries((raw.answers ?? {}) as Record<string, unknown>)) {
      if (strings(values)) saved.answers[id] = values;
    }
    for (const key of ['other', 'insights'] as const) {
      for (const [id, text] of Object.entries((raw[key] ?? {}) as Record<string, unknown>)) {
        if (typeof text === 'string') saved[key][id] = text;
      }
    }
    if (typeof raw.brief === 'string') saved.brief = raw.brief;
  } catch {
    // Storage blocked or unreadable: start fresh.
  }
  // A recommendation still on its way when the panel closed: use the built-in one.
  for (const question of activeQuestions(saved.answers)) {
    const values = saved.answers[question.id];
    if (question.insight && values && !values.includes(SKIPPED) && !saved.insights[question.id]) {
      saved.insights[question.id] = fallbackInsight(question.id, saved.answers);
    }
  }
  return saved;
}

/** Keeps entries for questions that are still answered (minus `except`). */
function keep(record: Record<string, string>, answers: Answers, except?: string): Record<string, string> {
  return Object.fromEntries(Object.entries(record).filter(([id]) => id in answers && id !== except));
}

/**
 * Project discovery inside the assistant panel: one question at a time,
 * answered by picking options. The questions come from lib/discovery/flow
 * (instant, always valid); the AI adds a short recommendation at two
 * checkpoints and writes the brief at the end. When the AI is slow or down,
 * built-in text takes its place, so the flow never stalls.
 *
 * Nothing is sent anywhere but the AI request; progress stays in this
 * browser's localStorage.
 */
export default function DiscoveryFlow() {
  const [initial] = useState(load);
  const [answers, setAnswers] = useState(initial.answers);
  const [other, setOther] = useState(initial.other);
  const [insights, setInsights] = useState(initial.insights);
  const [brief, setBrief] = useState(initial.brief);
  const [streaming, setStreaming] = useState<{ kind: Kind; id: string; text: string } | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [otherDraft, setOtherDraft] = useState('');
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle');
  /** Answers from before an edit, offered again as each later question returns. */
  const [remembered, setRemembered] = useState<{ answers: Answers; other: OtherText }>({ answers: {}, other: {} });
  const requestRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Set by every step; the next render moves focus to the new question. */
  const wantFocus = useRef(true);

  const question = streaming ? null : nextQuestion(answers);
  const { step, total, done } = progress(answers);
  const answered = activeQuestions(answers).filter((item) => item.id in answers);
  const briefText = streaming?.kind === 'brief' ? streaming.text : brief;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, other, insights, brief }));
    } catch {
      // Private mode or storage full: the flow still works for this visit.
    }
  }, [answers, other, insights, brief]);

  // Closing discovery (switching to chat) stops any answer still streaming;
  // clearing the ref keeps its handlers from starting anything after.
  useEffect(
    () => () => {
      requestRef.current?.abort();
      requestRef.current = null;
    },
    [],
  );

  // Each step scrolls the latest answer (or the brief) to the top, so the
  // recommendation and next question below it are read together rather
  // than scrolled past. Picking options doesn't move anything.
  const scrollKey = `${answered.map((item) => item.id).join()}|${streaming?.kind ?? ''}|${done && !streaming}`;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const anchor = el.querySelector<HTMLElement>('[data-anchor]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: anchor ? anchor.offsetTop - 12 : 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [scrollKey]);

  // After each step, focus the next thing to act on. While the assistant is
  // writing there's nothing to act on yet, so focus waits on the scroll area
  // instead of falling out of the dialog.
  useEffect(() => {
    if (!wantFocus.current || !scrollRef.current) return;
    const target = scrollRef.current.querySelector<HTMLElement>('[data-autofocus]');
    if (target) {
      target.focus({ preventScroll: true });
      wantFocus.current = false;
    } else if (!scrollRef.current.contains(document.activeElement)) {
      scrollRef.current.focus({ preventScroll: true });
    }
  });

  function cancel() {
    requestRef.current?.abort();
    requestRef.current = null;
    setStreaming(null);
  }

  /** Streams an insight or the brief; built-in text replaces it on silence, error or timeout. */
  function stream(kind: Kind, id: string, nextAnswers: Answers, nextOther: OtherText) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    let text = '';
    let settled = false;
    setStreaming({ kind, id, text: '' });

    function settle(useFallback = false) {
      if (settled || requestRef.current !== controller) return;
      settled = true;
      clearTimeout(firstTimer);
      clearTimeout(totalTimer);
      controller.abort();
      requestRef.current = null;
      const value = (!useFallback && text.trim()) || (kind === 'brief' ? fallbackBrief(nextAnswers, nextOther) : fallbackInsight(id, nextAnswers));
      setStreaming(null);
      if (kind === 'brief') {
        setBrief(value);
        return;
      }
      if (value) setInsights((prev) => ({ ...prev, [id]: value }));
      if (!nextQuestion(nextAnswers)) stream('brief', 'brief', nextAnswers, nextOther);
    }

    const firstTimer = setTimeout(() => !text && settle(true), FIRST_TOKEN_MS[kind]);
    // A half-written answer reads worse than the built-in one.
    const totalTimer = setTimeout(() => settle(true), TOTAL_MS[kind]);

    streamDiscovery(
      kind,
      transcript(nextAnswers, nextOther),
      (event) => {
        if (settled) return;
        if (event.type === 'token') {
          text += event.content;
          setStreaming({ kind, id, text });
        } else {
          settle(event.type === 'error');
        }
      },
      controller.signal,
    ).catch(() => settle(true));
  }

  function commit(current: Question, values: string[], otherText = '') {
    const nextAnswers = answer(answers, current.id, values);
    const nextOther = keep(other, nextAnswers, current.id);
    if (values.includes(OTHER) && otherText.trim()) nextOther[current.id] = otherText.trim();
    const upcoming = nextQuestion(nextAnswers);
    const recalled = upcoming ? recall(upcoming, nextAnswers, remembered.answers) : [];
    setAnswers(nextAnswers);
    setOther(nextOther);
    setInsights(keep(insights, nextAnswers, current.id));
    setBrief('');
    setDraft(recalled);
    setOtherDraft(upcoming && recalled.includes(OTHER) ? (remembered.other[upcoming.id] ?? '') : '');
    setCopied('idle');
    wantFocus.current = true;
    if (current.insight && !values.includes(SKIPPED)) stream('insight', current.id, nextAnswers, nextOther);
    else if (!nextQuestion(nextAnswers)) stream('brief', 'brief', nextAnswers, nextOther);
    else cancel();
  }

  /** Reopens an answered question with its answer preselected; later answers are asked again. */
  function edit(target: Question) {
    cancel();
    const nextAnswers = rewind(answers, target.id);
    setRemembered((prev) => ({ answers: { ...prev.answers, ...answers }, other: { ...prev.other, ...other } }));
    setDraft((answers[target.id] ?? []).filter((value) => value !== SKIPPED));
    setOtherDraft(other[target.id] ?? '');
    setAnswers(nextAnswers);
    setOther(keep(other, nextAnswers));
    setInsights(keep(insights, nextAnswers));
    setBrief('');
    setCopied('idle');
    wantFocus.current = true;
  }

  function startOver() {
    cancel();
    setAnswers({});
    setOther({});
    setInsights({});
    setBrief('');
    setDraft([]);
    setOtherDraft('');
    setCopied('idle');
    setRemembered({ answers: {}, other: {} });
    wantFocus.current = true;
  }

  function toggle(current: Question, id: string) {
    setDraft((prev) => {
      if (prev.includes(id)) return prev.filter((value) => value !== id);
      if (!current.multiple || EXCLUSIVE.has(id)) return [id];
      const rest = prev.filter((value) => !EXCLUSIVE.has(value));
      if (current.max && rest.length >= current.max) return prev;
      return [...rest, id];
    });
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(`Project brief\n\n${brief}`);
      setCopied('done');
    } catch {
      setCopied('failed');
    }
  }

  const last = answered[answered.length - 1];
  const pct = done ? 1 : (step - 1) / total;

  return (
    <>
      <div ref={scrollRef} tabIndex={-1} className="relative flex-1 overflow-y-auto overscroll-contain px-5 py-5 outline-none">
        <div role="log" aria-live="polite" aria-busy={streaming?.kind === 'insight'} className="space-y-3">
          <Bubble>A few quick choices, and you’ll get a project brief to keep. Tap any answer to change it.</Bubble>

          {answered.map((item) => (
            <Fragment key={item.id}>
              <Bubble>{item.prompt(answers)}</Bubble>
              <div className="flex justify-end" data-anchor={item === last && !done ? true : undefined}>
                <button
                  type="button"
                  onClick={() => edit(item)}
                  className="group flex max-w-[85%] items-start gap-2 rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-left text-sm leading-relaxed text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <span className="sr-only">You answered: </span>
                  <span>{describe(item, answers[item.id], answers, other).join(', ')}</span>
                  <span className="sr-only">. Change this answer</span>
                  <Pencil aria-hidden="true" className="mt-1 h-3 w-3 shrink-0 opacity-50 transition-opacity group-hover:opacity-90" strokeWidth={2} />
                </button>
              </div>
              {insights[item.id] && <Insight>{insights[item.id]}</Insight>}
            </Fragment>
          ))}

          {streaming?.kind === 'insight' && (
            <Insight>{streaming.text || <span className="text-muted-foreground">Thinking…</span>}</Insight>
          )}
        </div>

        {question && (
          <QuestionCard
            key={question.id}
            question={question}
            answers={answers}
            draft={draft}
            otherDraft={otherDraft}
            onToggle={(id) => toggle(question, id)}
            onPick={(id) => commit(question, [id])}
            onOtherChange={setOtherDraft}
            onContinue={() => commit(question, draft, otherDraft)}
          />
        )}

        {done && (
          <section aria-labelledby="discovery-brief" data-anchor className="animate-fade-in mt-5 rounded-lg border border-border bg-card p-4">
            <h3 id="discovery-brief" className="text-sm font-semibold">
              Your project brief
            </h3>
            <p role="status" className="sr-only">
              {streaming?.kind === 'brief' ? 'Writing your brief.' : brief ? 'Your brief is ready.' : ''}
            </p>
            {streaming?.kind === 'brief' && !streaming.text && <p className="mt-3 text-sm text-muted-foreground">Writing your brief…</p>}
            <Brief text={briefText} />

            {!streaming && !brief && (
              <button
                type="button"
                data-autofocus
                onClick={() => stream('brief', 'brief', answers, other)}
                className="mt-3 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                Write my brief
              </button>
            )}

            {!streaming && brief && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs leading-relaxed text-muted-foreground">Copy it, then send it to me on LinkedIn.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    data-autofocus
                    onClick={copyBrief}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    {copied === 'done' ? (
                      <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Copy aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                    )}
                    {copied === 'done' ? 'Copied' : 'Copy brief'}
                  </button>
                  <a
                    href={contactHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm transition-colors hover:border-foreground/50"
                  >
                    Message me on LinkedIn
                    <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                </div>
                {copied === 'failed' && (
                  <p role="alert" className="mt-2 text-xs text-muted-foreground">
                    Couldn’t copy. Select the brief and copy it instead.
                  </p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-3 py-2.5">
        <button
          type="button"
          onClick={() => last && edit(last)}
          disabled={!last}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
          Back
        </button>

        <div className="min-w-0 flex-1">
          <div aria-hidden="true" className="h-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
              style={{ transform: `scaleX(${pct})` }}
            />
          </div>
          <p className="mt-1 text-center text-micro text-muted-foreground">
            {done ? (
              'Brief'
            ) : (
              <>
                <span className="sr-only">Question </span>
                {step} of {total}
              </>
            )}
          </p>
        </div>

        {done ? (
          <button
            type="button"
            onClick={startOver}
            className="inline-flex h-10 items-center rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
          >
            Start over
          </button>
        ) : (
          <button
            type="button"
            onClick={() => question && commit(question, [SKIPPED])}
            disabled={!question}
            className="inline-flex h-10 items-center rounded-lg px-2.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Skip
          </button>
        )}
      </div>
    </>
  );
}

function Bubble({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div className="flex justify-start">
      <p id={id} className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-2.5 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}

/** A recommendation: an assistant message with a rust rule, so advice reads apart from questions. */
function Insight({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-start">
      <p className="max-w-[85%] border-l-2 border-accent py-0.5 pl-3 text-sm leading-relaxed text-foreground">
        <span className="sr-only">Recommendation: </span>
        {children}
      </p>
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  answers: Answers;
  draft: string[];
  otherDraft: string;
  onToggle: (id: string) => void;
  onPick: (id: string) => void;
  onOtherChange: (text: string) => void;
  onContinue: () => void;
}

/**
 * The current question. Single choice answers on click; multiple choice
 * collects picks and continues. "Other" opens a short text box, and
 * "Not sure" sits apart from the real options.
 */
function QuestionCard({ question, answers, draft, otherDraft, onToggle, onPick, onOtherChange, onContinue }: QuestionCardProps) {
  const options = question.options(answers);
  const promptId = `discovery-q-${question.id}`;
  const otherOn = draft.includes(OTHER);
  const atMax = question.max !== undefined && draft.length >= question.max;
  const canContinue = question.multiple
    ? draft.length > 0 && (!otherOn || otherDraft.trim().length > 0)
    : otherOn && otherDraft.trim().length > 0;
  // Reopened with "Other" chosen, its text box takes focus instead.
  const focusId = otherOn ? null : (draft.find((value) => options.some((option) => option.id === value)) ?? options[0]?.id);

  const choose = (id: string) => (question.multiple || id === OTHER ? onToggle(id) : onPick(id));

  return (
    <div role="group" aria-labelledby={promptId} className="animate-fade-in mt-3">
      <Bubble id={promptId}>
        {question.prompt(answers)}
        {question.multiple && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {question.max ? `Pick up to ${question.max}.` : 'Pick any that apply.'}
          </span>
        )}
      </Bubble>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {options.map((option) => {
          const on = draft.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={on}
              disabled={question.multiple && !on && atMax}
              data-autofocus={option.id === focusId ? true : undefined}
              onClick={() => choose(option.id)}
              className={`flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm leading-snug transition-colors disabled:opacity-40 ${
                on ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-foreground/40'
              }`}
            >
              {question.multiple && <Tick on={on} />}
              <span className="min-w-0">{option.label}</span>
            </button>
          );
        })}
      </div>

      {(question.other || question.notSure) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {question.other && (
            <Chip on={otherOn} disabled={question.multiple && !otherOn && atMax} onClick={() => choose(OTHER)}>
              Other
            </Chip>
          )}
          {question.notSure && (
            <Chip on={draft.includes(NOT_SURE)} onClick={() => choose(NOT_SURE)}>
              Not sure
            </Chip>
          )}
        </div>
      )}

      {otherOn && (
        <div className="mt-3">
          <label htmlFor="discovery-other" className="sr-only">
            Describe it
          </label>
          <input
            id="discovery-other"
            // Opening "Other" is a request to type: focus follows.
            autoFocus
            data-autofocus
            value={otherDraft}
            maxLength={OTHER_MAX}
            onChange={(e) => onOtherChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canContinue) {
                e.preventDefault();
                onContinue();
              }
            }}
            placeholder="Describe it in a few words"
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      )}

      {(question.multiple || otherOn) && (
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="mt-3 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
        >
          Continue
        </button>
      )}
    </div>
  );
}

function Tick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors ${
        on ? 'border-accent bg-accent text-accent-foreground' : 'border-input'
      }`}
    >
      {on && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );
}

function Chip({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center rounded-lg border px-3.5 text-xs transition-colors disabled:opacity-40 ${
        on ? 'border-accent bg-accent/10 text-foreground' : 'border-dashed border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

/** The brief's ## headings and - items as elements; the text is never parsed as HTML. */
function Brief({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="mt-3 space-y-2 text-sm leading-relaxed">
      {parseBrief(text).map((block, index) => {
        if (block.kind === 'heading') {
          return (
            <h4 key={index} className="pt-1 text-xs font-semibold text-muted-foreground">
              {block.text}
            </h4>
          );
        }
        if (block.kind === 'list') {
          return (
            <ul key={index} className="space-y-1">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="relative pl-3.5 before:absolute before:left-0 before:top-[0.6em] before:h-px before:w-2 before:bg-accent">
                  {item}
                </li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
