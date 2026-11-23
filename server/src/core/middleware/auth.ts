import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';

/**
 * Session tokens for the two separate sign-in contexts: the admin CMS and
 * Creator Dashboard customers. They never mix:
 * - each has its own cookie, and its routes read only that cookie;
 * - each token names its context as the JWT audience, and verification
 *   requires the route's audience, so a customer token is no admin session;
 * - verification accepts HS256 only (the algorithm tokens are signed with);
 * - each token carries a version (`ver`); a route also checks it against the
 *   account's current version (admin-session.ts, customer-session.ts), so
 *   logging out (which bumps the version) revokes copies of the token too.
 */

export type SessionKind = 'admin' | 'customer';
export type UserRole = 'admin' | 'user';

export interface AuthTokenPayload {
  sub: string; // account id ('admin' for the CMS admin)
  role: UserRole;
  email?: string;
  /** The account's token version when this token was issued. */
  ver: number;
}

// Augment Express's Request type so `req.user` is available and typed in
// every module.
declare global {
  // Augmenting Express's own namespace is the only way to type req.user.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export const AUTH_COOKIE_NAME = 'admin_token';
export const SAAS_AUTH_COOKIE_NAME = 'saas_token';

const COOKIE: Record<SessionKind, string> = { admin: AUTH_COOKIE_NAME, customer: SAAS_AUTH_COOKIE_NAME };
const AUDIENCE: Record<SessionKind, string> = { admin: 'portfolio-admin', customer: 'portfolio-customer' };
const ROLE: Record<SessionKind, UserRole> = { admin: 'admin', customer: 'user' };
const ISSUER = 'portfolio-api';
const ALGORITHM = 'HS256';
const LIFETIME = '7d';

export function signAccessToken(kind: SessionKind, claims: { sub: string; email?: string; ver: number }): string {
  const payload: AuthTokenPayload = { sub: claims.sub, role: ROLE[kind], email: claims.email, ver: claims.ver };
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: LIFETIME,
    audience: AUDIENCE[kind],
    issuer: ISSUER,
  });
}

/** The token's claims if it is a valid token of this kind; throws a 401 otherwise. */
export function verifyAccessToken(kind: SessionKind, token: string): AuthTokenPayload {
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM], audience: AUDIENCE[kind], issuer: ISSUER });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw new AppError('Token has expired', 401);
    throw new AppError('Invalid or malformed token', 401);
  }
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.ver !== 'number' || decoded.role !== ROLE[kind]) {
    throw new AppError('Invalid token payload', 401);
  }
  return { sub: decoded.sub, role: decoded.role, email: typeof decoded.email === 'string' ? decoded.email : undefined, ver: decoded.ver };
}

/** A Bearer token if one is sent, otherwise this kind's session cookie. */
export function sessionToken(req: Request, kind: SessionKind): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }
  const cookie = req.cookies?.[COOKIE[kind]];
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : null;
}

/**
 * Guards a route for one kind of session. `currentVersion` returns the
 * account's token version (null when the account no longer exists); a token
 * issued under an older version has been revoked.
 */
export function requireSession(
  kind: SessionKind,
  currentVersion: (sub: string) => Promise<number | null>,
): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = sessionToken(req, kind);
    if (!token) throw new AppError('Authentication required', 401);
    const claims = verifyAccessToken(kind, token);
    const version = await currentVersion(claims.sub);
    if (version === null || version !== claims.ver) throw new AppError('Your session has ended. Please sign in again.', 401);
    req.user = claims;
    next();
  };
}

/**
 * "role:sub" for a request carrying a valid token of either kind, or null.
 * Never throws, never touches the database: it only keys rate limits by
 * account (rateLimiter.ts), it is not a guard.
 */
export function verifiedSessionKey(req: Request): string | null {
  for (const kind of ['customer', 'admin'] as const) {
    const token = sessionToken(req, kind);
    if (!token) continue;
    try {
      const { role, sub } = verifyAccessToken(kind, token);
      return `${role}:${sub}`;
    } catch {
      // Not this kind; try the other.
    }
  }
  return null;
}
