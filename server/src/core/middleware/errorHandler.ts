import type { NextFunction, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { errorFields, log } from '../logger.js';
import { routeForLog } from './http-hygiene.js';

/**
 * Custom error class for known, expected failures (bad input, not found,
 * unauthorized, etc). Anything thrown as AppError is treated as "safe to
 * show the client" — anything else is treated as an unexpected bug and
 * sanitized before being sent back.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Catches requests to routes that don't exist. Must be mounted AFTER
 * all module routers in app.ts, but BEFORE errorHandler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Centralized error-handling middleware. Must be the LAST app.use() call
 * in app.ts — Express identifies error middleware by its 4-argument
 * signature, so the parameter count below is required, not stylistic.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known, safe-to-expose errors (AppError instances)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
      },
    });
    return;
  }

  // Zod validation errors — shape them into a consistent 400 response
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: z.flattenError(err).fieldErrors,
      },
    });
    return;
  }

  // Mongoose duplicate key error (e.g. unique email already exists)
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    res.status(409).json({
      error: {
        message: 'A record with this value already exists',
      },
    });
    return;
  }

  // Anything else is unexpected: log what it takes to find it (route, error
  // name and short message, stack), and never leak internals to the client.
  log.error('Unhandled error', {
    method: req.method,
    // Ids masked as in the request log: a chat session id grants access to that chat.
    route: routeForLog(req.originalUrl),
    ...errorFields(err),
    // Without its first line, which repeats the message errorFields already shortened.
    stack: err instanceof Error ? err.stack?.split('\n').slice(1).join('\n').slice(0, 2000) : undefined,
  });

  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}