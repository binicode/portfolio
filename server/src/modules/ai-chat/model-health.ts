/**
 * Which Gemini model to use, from each model's recent health. Pure: no SDK
 * or config imports, so it can be tested on its own. llm.service.ts holds
 * the live health state and runs the background checks.
 *
 * A model that hangs or reports it is at capacity is marked down, so
 * visitors don't each pay the first-chunk timeout while it is (measured:
 * gemini-flash-latest stopped answering entirely; every chat turn waited
 * 10 s before the fallback answered in under 2 s, and the planner, which
 * waits 4 s for a first word, fell back to its built-in text). A down model
 * is never retried on a visitor's request: once its back-off has passed, a
 * tiny background check decides whether it is back. Each consecutive
 * failure doubles the back-off, from 5 minutes up to an hour.
 */

// Tried in order. When the primary model is overloaded (Gemini returns
// 503 "high demand") or hangs, the lighter model usually still answers,
// so a visitor gets a reply instead of an error. Both are "-latest"
// aliases that are available to new API keys.
export const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'] as const;

const BACKOFF_BASE_MS = 5 * 60 * 1000;
const BACKOFF_MAX_MS = 60 * 60 * 1000;

export interface ModelHealth {
  failures: number;
  /** When the next background check may run. */
  retryAt: number;
}

export function backoffMs(failures: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** Math.max(0, failures - 1), BACKOFF_MAX_MS);
}

/**
 * The models to use for a visitor's request, in preference order: the
 * healthy ones. If none is healthy, all of them: a slow answer beats none.
 */
export function modelsToTry(health: ReadonlyMap<string, ModelHealth>): string[] {
  const healthy = GEMINI_MODELS.filter((model) => !health.has(model));
  return healthy.length > 0 ? healthy : [...GEMINI_MODELS];
}

/** Down models whose back-off has passed and that aren't being checked already. */
export function modelsDueForCheck(
  now: number,
  health: ReadonlyMap<string, ModelHealth>,
  checking: ReadonlySet<string> = new Set(),
): string[] {
  return GEMINI_MODELS.filter((model) => {
    const state = health.get(model);
    return state !== undefined && state.retryAt <= now && !checking.has(model);
  });
}
