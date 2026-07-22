import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, AppError } from '../../core/middleware/errorHandler.js';
import { sendChatMessage } from './ai-chat.service.js';
import { ChatSessionModel } from './ai-chat.model.js';
import type { ChatStreamEvent } from './ai-chat.types.js';

const sendMessageBodySchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

/**
 * POST /chat
 * Streams a chat completion over Server-Sent Events. Each
 * ChatStreamEvent yielded by the orchestration service is forwarded to
 * the client as a single SSE `data:` frame.
 */
export const postChatMessage = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId, message } = sendMessageBodySchema.parse(req.body);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
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
    // has to be reported as an SSE error frame instead.
    if (!clientDisconnected) {
      writeEvent({
        type: 'error',
        message:
          error instanceof AppError
            ? error.message
            : 'Something went wrong while generating a response',
      });
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

/**
 * GET /chat/:sessionId
 * Returns the full message history for a session, used to restore the
 * widget's conversation on page reload. An unknown sessionId returns an
 * empty history rather than a 404 — a new visitor simply has none yet.
 */
export const getChatHistory = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = z.string().uuid().parse(req.params.sessionId);

  const session = await ChatSessionModel.findOne({ sessionId }).lean();

  res.status(200).json({
    sessionId,
    messages: session?.messages ?? [],
  });
});