import { Schema, model } from 'mongoose';
import { env } from '../../core/config/env.js';
import { isDatabaseReady } from '../../core/config/db.js';
import { sendEmail } from '../../core/email/email.js';
import { aiBudgetAlert } from '../../core/email/messages.js';
import { log } from '../../core/logger.js';

/**
 * A ceiling on what the assistant and the planner can spend on Gemini in a
 * day (UTC), shared by every server process through MongoDB. Each finished
 * completion adds its estimated cost (gemini-models.ts); once the day's
 * total reaches AI_DAILY_COST_CAP_USD, requests are answered without
 * calling Gemini until midnight UTC, and the owner is emailed once.
 *
 * Without the database the total is kept in this process only. A failed
 * check lets the request through (logged): the cap limits cost, and a
 * database hiccup shouldn't silence the assistant.
 */

const usageSchema = new Schema({
  _id: { type: String, required: true }, // the UTC day, YYYY-MM-DD
  costMicroUsd: { type: Number, default: 0 },
  completions: { type: Number, default: 0 },
  alertedAt: { type: Date },
  // Kept 90 days for a look back, then removed by MongoDB.
  expiresAt: { type: Date, required: true, expires: 0 },
});

const AiUsageModel = model('AiUsage', usageSchema, 'ai_usage');

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);
const capMicroUsd = () => Math.round(env.AI_DAILY_COST_CAP_USD * 1_000_000);

// Without the database: this process's total for the current day.
let memory = { day: '', costMicroUsd: 0, alerted: false };
function memoryFor(day: string) {
  if (memory.day !== day) memory = { day, costMicroUsd: 0, alerted: false };
  return memory;
}

/** Whether today's spending is still under the cap. */
export async function withinDailyBudget(): Promise<boolean> {
  const day = utcDay();
  if (!isDatabaseReady()) return memoryFor(day).costMicroUsd < capMicroUsd();
  try {
    const usage = await AiUsageModel.findById(day, { costMicroUsd: 1 }).lean();
    return (usage?.costMicroUsd ?? 0) < capMicroUsd();
  } catch (error) {
    log.error('AI budget check failed; letting the request through', { reason: error instanceof Error ? error.name : 'unknown' });
    return true;
  }
}

async function alertOnce(day: string, totalMicroUsd: number): Promise<void> {
  log.warn('AI daily cost cap reached', { day, costUsd: totalMicroUsd / 1_000_000, capUsd: env.AI_DAILY_COST_CAP_USD });
  if (env.ALERT_EMAIL_TO) await sendEmail(aiBudgetAlert(env.ALERT_EMAIL_TO, day, env.AI_DAILY_COST_CAP_USD), `ai-budget/${day}`);
}

/** Adds a finished completion's cost to today's total; the first time the total reaches the cap, alerts. */
export async function recordAiCost(costMicroUsd: number): Promise<void> {
  const day = utcDay();
  if (!isDatabaseReady()) {
    const today = memoryFor(day);
    today.costMicroUsd += costMicroUsd;
    if (today.costMicroUsd >= capMicroUsd() && !today.alerted) {
      today.alerted = true;
      await alertOnce(day, today.costMicroUsd);
    }
    return;
  }
  const usage = await AiUsageModel.findOneAndUpdate(
    { _id: day },
    { $inc: { costMicroUsd, completions: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + RETENTION_MS) } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
  if (!usage || usage.costMicroUsd < capMicroUsd() || usage.alertedAt) return;
  // Only the request that sets alertedAt sends the alert, however many cross the cap together.
  const claimed = await AiUsageModel.updateOne({ _id: day, alertedAt: { $exists: false } }, { $set: { alertedAt: new Date() } });
  if (claimed.modifiedCount === 1) await alertOnce(day, usage.costMicroUsd);
}
