import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

export type UserRole = 'admin' | 'user';

export interface AuthTokenPayload {
  sub: string; // user id
  role: UserRole;
  email?: string;
}

// Augment Express's Request type so `req.user` is available and typed
// on every request, in every module, without re-declaring it per file.
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

// Name of the httpOnly cookie used by browser-based sessions (the admin
// CMS). Exported so admin-auth.controller.ts sets/clears the exact same
// cookie this middleware reads — duplicating this string in two files
// would be the kind of copy-paste drift that breaks silently the first
// time one of them gets renamed.
export const AUTH_COOKIE_NAME = 'admin_token';

function getJwtSecret(): string {
  if (!env.JWT_SECRET) {
    throw new AppError('Server misconfiguration: JWT_SECRET is not set', 500);
  }
  return env.JWT_SECRET;
}

export function signAccessToken(payload: AuthTokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'string') {
      throw new AppError('Invalid token payload', 401);
    }
    return decoded as AuthTokenPayload;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401);
    }
    throw new AppError('Invalid or malformed token', 401);
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

function extractCookieToken(req: Request): string | null {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  return typeof token === 'string' && token.length > 0 ? token : null;
}

/**
 * Reads the access token from either an Authorization: Bearer header
 * (for API-style clients — e.g. a future Month 2 SaaS module's own
 * end users) or the httpOnly session cookie (used by the admin CMS's
 * browser session). Bearer takes priority when both are present.
 */
function extractToken(req: Request): string | null {
  return extractBearerToken(req) ?? extractCookieToken(req);
}

/**
 * Guards a route — requires a valid token from either a Bearer header
 * or the httpOnly auth cookie. On success, attaches the decoded
 * payload to req.user for downstream handlers to use.
 *
 * Usage: router.get('/dashboard', requireAuth, dashboardController)
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new AppError('Authentication required', 401));
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Guards a route by role. Must run AFTER requireAuth, since it depends
 * on req.user already being set.
 *
 * Usage: router.delete('/users/:id', requireAuth, requireRole('admin'), deleteUserController)
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }
    next();
  };
}