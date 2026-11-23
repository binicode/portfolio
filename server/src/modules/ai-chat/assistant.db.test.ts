// Run with `npm test` in server/. The assistant against a real MongoDB (in
// memory) and a local stand-in for Gemini's API: the real Gemini SDK sends
// real requests, to a server here that records them and streams answers the
// way Gemini does. Covers the pinned models' settings, the daily cost cap
// and its single alert, and the fallback model. The tests share one
// database and one fake, and run in order.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { GoogleGenAI } from '@google/genai';
import { startDatabaseApp, type DatabaseApp } from '../../test-support/database-app.js';

interface GeminiCall {
  model: string;
  body: {
    generationConfig?: { maxOutputTokens?: number; thinkingConfig?: { thinkingLevel?: string } };
    systemInstruction?: unknown;
  };
}

let app: DatabaseApp;
let fakeGemini: Server;
const calls: GeminiCall[] = [];
/** Models the fake answers as overloaded (503). */
const overloaded = new Set<string>();

// Each answer: 1,000 tokens in, 200 out. At gemini-3.5-flash-lite's prices
// ($0.30 / $2.50 per million) that is $0.0008; the cap below is $0.002, so
// the third answer reaches it.
const USAGE = { promptTokenCount: 1000, candidatesTokenCount: 200, thoughtsTokenCount: 0, totalTokenCount: 1200 };

before(async () => {
  fakeGemini = createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    const model = /models\/([^:/]+):streamGenerateContent/.exec(req.url ?? '')?.[1] ?? 'unknown';
    calls.push({ model, body: JSON.parse(raw || '{}') });
    if (overloaded.has(model)) {
      res.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: { code: 503, message: 'overloaded', status: 'UNAVAILABLE' } }));
      return;
    }
    const frame = (body: object) => `data: ${JSON.stringify(body)}\r\n\r\n`;
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(frame({ candidates: [{ content: { role: 'model', parts: [{ text: `Answer from ${model}.` }] }, index: 0 }] }));
    res.end(frame({ candidates: [{ content: { role: 'model', parts: [{ text: '' }] }, finishReason: 'STOP', index: 0 }], usageMetadata: USAGE }));
  });
  fakeGemini.listen(0);
  await new Promise((resolve) => fakeGemini.once('listening', resolve));

  app = await startDatabaseApp({ AI_DAILY_COST_CAP_USD: '0.002', ALERT_EMAIL_TO: 'owner@example.com' });
  const { setGeminiClientForTests } = await import('./llm.service.js');
  setGeminiClientForTests(
    new GoogleGenAI({ apiKey: 'test-key', httpOptions: { baseUrl: `http://127.0.0.1:${(fakeGemini.address() as AddressInfo).port}` } }),
  );
});

after(async () => {
  await app?.stop();
  await new Promise((resolve) => fakeGemini?.close(resolve));
});

const SESSION = '22222222-2222-4222-8222-222222222222';
const ask = async (message: string) => String((await app.post('/api/ai-chat/chat', { sessionId: SESSION, message })).body);

test('the primary pinned model answers, with near-off thinking and room for it', async () => {
  const answer = await ask('What does Biniyam build?');
  assert.match(answer, /Answer from gemini-3\.5-flash-lite\./);
  assert.match(answer, /"type":"done"/);

  const call = calls.at(-1)!;
  assert.equal(call.model, 'gemini-3.5-flash-lite');
  assert.equal(call.body.generationConfig?.thinkingConfig?.thinkingLevel, 'MINIMAL');
  assert.equal(call.body.generationConfig?.maxOutputTokens, 1024 + 512, 'the answer limit plus thinking headroom');
  assert.ok(call.body.systemInstruction, 'the grounding instructions are sent');
});

test('the daily cost cap: once reached, the owner is told once and Gemini is not called', async () => {
  await ask('Second question');
  const sent = app.outbox.length;
  await ask('Third question: this one reaches the cap');
  const alert = await app.nextEmail((m) => m.kind === 'ai-budget-alert', sent);
  assert.equal(alert.to, 'owner@example.com');
  assert.match(alert.text, /allowance of \$0\.002 /);

  const before = calls.length;
  const capped = await ask('Fourth question');
  assert.match(capped, /The assistant has reached its limit for today\. Please try again tomorrow\./);
  assert.equal(calls.length, before, 'no request reaches Gemini over the cap');

  await ask('Fifth question');
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(app.outbox.filter((m) => m.kind === 'ai-budget-alert').length, 1, 'one alert a day');
});

test('when the primary model is overloaded, the second answers with its own settings', async () => {
  // A fresh day's budget: the test moves the cap's record aside.
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.collection('ai_usage').deleteMany({});

  overloaded.add('gemini-3.5-flash-lite');
  const answer = await ask('Sixth question');
  assert.match(answer, /Answer from gemini-4-hydrogen\./);
  const call = calls.at(-1)!;
  assert.equal(call.model, 'gemini-4-hydrogen');
  assert.equal(call.body.generationConfig?.thinkingConfig?.thinkingLevel, 'LOW');
  assert.equal(call.body.generationConfig?.maxOutputTokens, 1024 + 2048);
  // Let the answer's cost record (written after the response) finish before the database stops.
  await new Promise((resolve) => setTimeout(resolve, 200));
});
