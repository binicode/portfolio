import type { Request, Response } from 'express';
import { asyncHandler } from '../../core/middleware/errorHandler.js';
import { streamText, type TextStreamEvent } from './llm.service.js';
import { buildDiscoveryPrompt, discoveryBodySchema } from './discovery.prompt.js';

/**
 * Project discovery: a prospective client answers a short multiple-choice
 * questionnaire in the assistant (the questions live in the client), and
 * this endpoint writes the AI parts: a one-line recommendation between
 * questions, and the project brief at the end.
 *
 * Stateless: nothing is stored, no account or database involved. The
 * client sends the questions and answers as plain text it showed the
 * visitor; they are length-limited here and handed to the model as data.
 */

const MAX_TOKENS = { insight: 160, brief: 600 } as const;

/**
 * POST /discovery
 * Streams the recommendation or the brief over Server-Sent Events, in the
 * same frame format as /chat (`data: {...}\n\n`).
 */
export const postDiscovery = asyncHandler(async (req: Request, res: Response) => {
  const body = discoveryBodySchema.parse(req.body);
  const { systemInstruction, answers } = buildDiscoveryPrompt(body);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });
  const write = (event: TextStreamEvent) => res.write(`data: ${JSON.stringify(event)}\n\n`);

  try {
    for await (const event of streamText(
      systemInstruction,
      [{ role: 'user', parts: [{ text: answers }] }],
      MAX_TOKENS[body.kind],
      `postDiscovery(${body.kind})`,
    )) {
      if (clientDisconnected) break;
      write(event);
    }
  } catch (error) {
    // Headers are already sent, so report failure as a stream frame; the
    // client falls back to its built-in recommendation.
    console.error('postDiscovery: failed', error);
    if (!clientDisconnected) write({ type: 'error', message: "The assistant can't answer right now." });
  } finally {
    if (!res.writableEnded) res.end();
  }
});
