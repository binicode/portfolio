import type { Response } from '@playwright/test';

/** One server-sent event frame from the assistant endpoints. */
export type StreamEvent =
  | { type: 'token'; content: string }
  | { type: 'done'; usage?: { inputTokens: number; outputTokens: number }; retrievedSources?: Array<{ sourceTitle: string }> }
  | { type: 'error'; message: string };

export interface StreamSummary {
  status: number;
  text: string;
  tokens: number;
  done?: Extract<StreamEvent, { type: 'done' }>;
  error?: string;
}

/**
 * Reads a finished SSE response (`data: {...}` frames) the way the client
 * does. A `done` frame with token usage means a model really answered: the
 * server only sends usage after Gemini's stream completes.
 */
export async function readStream(response: Response): Promise<StreamSummary> {
  const body = await response.text();
  const summary: StreamSummary = { status: response.status(), text: '', tokens: 0 };
  for (const line of body.split('\n')) {
    if (!line.startsWith('data:')) continue;
    let event: StreamEvent;
    try {
      event = JSON.parse(line.slice(5).trim()) as StreamEvent;
    } catch {
      continue;
    }
    if (event.type === 'token') {
      summary.text += event.content;
      summary.tokens += 1;
    } else if (event.type === 'done') {
      summary.done = event;
    } else if (event.type === 'error') {
      summary.error = event.message;
    }
  }
  if (summary.status >= 400 && !summary.error) {
    try {
      summary.error = (JSON.parse(body) as { error?: { message?: string } }).error?.message;
    } catch {
      summary.error = body.slice(0, 200);
    }
  }
  return summary;
}
