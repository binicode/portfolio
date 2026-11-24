import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../core/middleware/errorHandler.js';
import { getSessionMessages, sendChatMessage } from './ai-chat.service.js';
import type { ChatStreamEvent } from './ai-chat.types.js';
import { errorFields, log } from '../../core/logger.js';

const sendMessageBodySchema = z.object({
  sessionId: z.uuid(),
  message: z.string().min(1).max(2000),
});

/**
 * POST /chat
 * Streams a chat completion over Server-Sent Events. Each
 * ChatStreamEvent yielded by the orchestration service is forwarded to
 * the client as a single SSE `data:` frame.
 */
export const postChatMessage = async (req: Request, res: Response) => {
  const { sessionId, message } = sendMessageBodySchema.parse(req.body);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // The response's 'close' before it has finished means the visitor went
  // away; the request's own 'close' fires as soon as its body has been read,
  // so it can't tell. Stopping early stops the model call (and its cost).
  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableFinished) clientDisconnected = true;
  });

  const writeEvent = (event: ChatStreamEvent): void => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    for await (const event of sendChatMessage({ sessionId, message })) {
      if (clientDisconnected) {
        break;
      }
      writeEvent(event);
    }
  } catch (error) {
    // Headers are already committed to the SSE response at this point,
    // so a thrown error can't become a normal JSON error response — it
    // has to be reported as an SSE error frame instead. It also never
    // reaches errorHandler.ts, so it is logged here: before, failures in
    // embedding/retrieval/persistence left no trace server-side.
    const isClientError = error instanceof AppError && error.statusCode < 500;
    if (!isClientError) {
      log.error('Chat turn failed', errorFields(error));
    }

    if (!clientDisconnected) {
      writeEvent({
        type: 'error',
        // Only client errors are safe to show verbatim; server-side
        // AppErrors can carry provider responses or config details.
        message: isClientError
          ? error.message
          : "The assistant can't answer right now. Please try again in a moment.",
      });
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
};

/**
 * GET /chat/:sessionId
 * Returns the full message history for a session, used to restore the
 * widget's conversation on page reload. An unknown sessionId returns an
 * empty history rather than a 404 — a new visitor simply has none yet.
 */
export const getChatHistory = async (req: Request, res: Response) => {
  const sessionId = z.uuid().parse(req.params.sessionId);

  // From MongoDB, or the in-memory store while the database is unreachable.
  const messages = await getSessionMessages(sessionId);

  res.status(200).json({ sessionId, messages });
};