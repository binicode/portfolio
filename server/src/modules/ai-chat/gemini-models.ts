/**
 * The Gemini models the assistant and the planner use, pinned to stable
 * versions. Google: "Most production apps should use a specific stable
 * model"; a `-latest` alias is swapped to a new model with two weeks'
 * notice. Tried in order: the second answers when the first is overloaded
 * or down (model-health.ts). Pure: no SDK or config imports.
 *
 * Checked against Google's model, pricing and thinking pages on 2026-11-23:
 * - gemini-3.5-flash-lite: "fastest, most cost-effective"; thinking defaults
 *   to minimal (near off).
 * - gemini-4-hydrogen: stronger; thinking can't go below low (default high).
 *
 * Thinking tokens count towards maxOutputTokens and are billed as output, so
 * each model gets headroom on top of the visible answer's limit: otherwise
 * thinking could use up a short budget (the planner's 160-token note) and
 * leave no answer. The order is provisional until both are measured on the
 * knowledge-base questions with the production key.
 *
 * Prices are the paid tier's, in US dollars per million tokens. The daily
 * cost cap (ai-budget.ts) counts them even on the free tier, so the cap
 * already holds if billing is turned on.
 */
export interface GeminiModel {
  id: string;
  thinkingLevel: 'MINIMAL' | 'LOW';
  /** Extra output tokens allowed for thinking, on top of the answer's limit. */
  thinkingHeadroom: number;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
}

export const GEMINI_MODELS: readonly GeminiModel[] = [
  { id: 'gemini-3.5-flash-lite', thinkingLevel: 'MINIMAL', thinkingHeadroom: 512, inputUsdPerMillion: 0.3, outputUsdPerMillion: 2.5 },
  { id: 'gemini-4-hydrogen', thinkingLevel: 'LOW', thinkingHeadroom: 2048, inputUsdPerMillion: 1.5, outputUsdPerMillion: 7.5 },
];

export const GEMINI_MODEL_IDS: readonly string[] = GEMINI_MODELS.map((model) => model.id);

export function geminiModel(id: string): GeminiModel {
  const found = GEMINI_MODELS.find((model) => model.id === id);
  if (!found) throw new Error(`Unknown Gemini model: ${id}`);
  return found;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
}

/** What a completion costs at paid-tier prices, in millionths of a dollar (thinking is billed as output). */
export function costMicroUsd(model: GeminiModel, usage: TokenUsage): number {
  return Math.ceil(usage.inputTokens * model.inputUsdPerMillion + (usage.outputTokens + usage.thinkingTokens) * model.outputUsdPerMillion);
}
