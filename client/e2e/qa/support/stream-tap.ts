import type { Page } from '@playwright/test';

/**
 * Records the assistant's SSE streams inside the page. The discovery flow
 * aborts each request as soon as its `done` frame arrives, which leaves
 * Playwright unable to read the response body; a tee of the body in the page
 * still sees every frame, plus how long the first one took (the client shows
 * built-in text when the first word takes over 4 s for a recommendation or
 * 6 s for the brief).
 */
export async function tapAssistantStreams(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type Entry = { kind: string; status: number; text: string; firstChunkMs: number | null; totalMs: number | null; aborted?: string };
    const w = window as unknown as { __qaStreams: Entry[] };
    w.__qaStreams = [];
    const original = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await original(input, init);
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (/\/api\/ai-chat\/(discovery|chat)$/.test(url) && init?.method === 'POST' && response.body) {
        let kind = url.endsWith('/chat') ? 'chat' : '?';
        try {
          kind = (JSON.parse(String(init.body)) as { kind?: string }).kind ?? kind;
        } catch {
          // Not JSON: keep the default.
        }
        const started = performance.now();
        const entry: Entry = { kind, status: response.status, text: '', firstChunkMs: null, totalMs: null };
        w.__qaStreams.push(entry);
        const reader = response.clone().body!.getReader();
        const decoder = new TextDecoder();
        void (async () => {
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              if (entry.firstChunkMs === null) entry.firstChunkMs = Math.round(performance.now() - started);
              entry.text += decoder.decode(value, { stream: true });
            }
            entry.totalMs = Math.round(performance.now() - started);
          } catch (error) {
            entry.aborted = String(error);
            entry.totalMs = Math.round(performance.now() - started);
          }
        })();
      }
      return response;
    };
  });
}

export interface TappedStream {
  kind: string;
  status: number;
  /** The concatenated token text. */
  answer: string;
  tokenFrames: number;
  sawDone: boolean;
  errorFrame?: string;
  firstChunkMs: number | null;
  totalMs: number | null;
}

export async function readTappedStreams(page: Page): Promise<TappedStream[]> {
  const entries = await page.evaluate(
    () => (window as unknown as { __qaStreams: Array<{ kind: string; status: number; text: string; firstChunkMs: number | null; totalMs: number | null }> }).__qaStreams,
  );
  return entries.map((entry) => {
    const stream: TappedStream = {
      kind: entry.kind,
      status: entry.status,
      answer: '',
      tokenFrames: 0,
      sawDone: false,
      firstChunkMs: entry.firstChunkMs,
      totalMs: entry.totalMs,
    };
    for (const line of entry.text.split('\n')) {
      if (!line.startsWith('data:')) continue;
      try {
        const event = JSON.parse(line.slice(5).trim()) as { type: string; content?: string; message?: string };
        if (event.type === 'token') {
          stream.answer += event.content ?? '';
          stream.tokenFrames += 1;
        } else if (event.type === 'done') stream.sawDone = true;
        else if (event.type === 'error') stream.errorFrame = event.message;
      } catch {
        // A frame cut by the abort.
      }
    }
    return stream;
  });
}
