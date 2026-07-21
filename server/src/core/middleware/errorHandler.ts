import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';

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
 * Wraps async route handlers so rejected promises are forwarded to
 * Express's error pipeline automatically, instead of requiring a
 * try/catch in every controller.
 *
 * Usage: router.get('/foo', asyncHandler(fooController))
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        details: err.flatten().fieldErrors,
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

  // Anything else is unexpected — log it fully, but never leak internals
  // to the client. Stack traces only appear in non-production logs.
  console.error('Unhandled error:', err);
  if (env.NODE_ENV !== 'production' && err instanceof Error) {
    console.error(err.stack);
  }

  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}