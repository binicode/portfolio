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

// Two separate cookies for two separate auth contexts — the admin CMS
// and the SaaS module each get their own, so logging into one never
// silently overwrites or is overwritten by the other.
export const AUTH_COOKIE_NAME = 'admin_token';
export const SAAS_AUTH_COOKIE_NAME = 'saas_token';

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

/**
 * Route-aware cookie resolution — this replaces an earlier "check
 * admin_token first, always" version that had a real, confirmed bug:
 * a browser holding both cookies at once (trivially easy during
 * manual testing of both the admin panel and the SaaS module) would
 * always authenticate as admin, even on SaaS-guarded routes, causing
 * requireRole('user') to correctly but confusingly reject a valid SaaS
 * session with a 403.
 *
 * Every cookie-guarded route already lives under either /api/admin/*
 * or /api/saas/* — so req.originalUrl alone is enough to know which
 * cookie actually applies, without requiring any change to how
 * requireAuth is used in route files.
 */
function extractCookieToken(req: Request): string | null {
  const isSaasRoute = req.originalUrl.startsWith('/api/saas');
  const isAdminRoute = req.originalUrl.startsWith('/api/admin');

  if (isSaasRoute) {
    const saasToken = req.cookies?.[SAAS_AUTH_COOKIE_NAME];
    return typeof saasToken === 'string' && saasToken.length > 0 ? saasToken : null;
  }

  if (isAdminRoute) {
    const adminToken = req.cookies?.[AUTH_COOKIE_NAME];
    return typeof adminToken === 'string' && adminToken.length > 0 ? adminToken : null;
  }

  // Defensive fallback for a route outside both prefixes — shouldn't
  // happen given every cookie-guarded route today lives under one of
  // them, but checks both rather than silently authenticating no one.
  const adminToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof adminToken === 'string' && adminToken.length > 0) {
    return adminToken;
  }
  const saasToken = req.cookies?.[SAAS_AUTH_COOKIE_NAME];
  return typeof saasToken === 'string' && saasToken.length > 0 ? saasToken : null;
}

/**
 * Reads the access token from either an Authorization: Bearer header
 * (for API-style clients) or the route-appropriate httpOnly session
 * cookie. Bearer takes priority when present.
 */
function extractToken(req: Request): string | null {
  return extractBearerToken(req) ?? extractCookieToken(req);
}

/**
 * Guards a route — requires a valid token from either a Bearer header
 * or the correct httpOnly auth cookie for this route. On success,
 * attaches the decoded payload to req.user for downstream handlers.
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
