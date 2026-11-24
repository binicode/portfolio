import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { isDatabaseReady } from '../../core/config/db.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { AUTH_COOKIE_NAME, sessionToken, signAccessToken, verifyAccessToken } from '../../core/middleware/auth.js';
import { ADMIN_ID, adminTokenVersion, endAdminSession } from './admin-session.js';
import type { AdminLoginResult } from './admin.types.js';
import { clearSessionCookieOptions, sessionCookieOptions } from '../../core/config/session-cookie.js';
import { errorFields, log } from '../../core/logger.js';

const cookieSettings = () => ({ production: env.NODE_ENV === 'production', domain: env.COOKIE_DOMAIN });

const adminLoginBodySchema = z.object({
  email: z.email({ error: 'Enter a valid email address.' }),
  password: z.string().min(1),
});

/**
 * POST /admin/login
 * Validates credentials against the single hardcoded admin identity
 * defined in env (ADMIN_EMAIL / ADMIN_PASSWORD_HASH) and sets an
 * httpOnly session cookie on success. The token is deliberately never
 * returned in the JSON body — an httpOnly cookie that client-side JS
 * can also read out of a fetch response defeats its own purpose.
 */
export const postAdminLogin = async (req: Request, res: Response) => {
  const { email, password } = adminLoginBodySchema.parse(req.body);
  // ADMIN_EMAIL and ADMIN_PASSWORD_HASH are required at start-up (env.ts).

  // The password is always compared, so the response time does not reveal
  // whether the email was the admin's.
  const passwordMatches = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
  const emailMatches = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

  if (!emailMatches || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signAccessToken('admin', { sub: ADMIN_ID, email: env.ADMIN_EMAIL, ver: await adminTokenVersion() });

  res.cookie(AUTH_COOKIE_NAME, token, sessionCookieOptions(cookieSettings()));

  const result: AdminLoginResult = { success: true };
  res.status(200).json(result);
};

/**
 * POST /admin/logout
 * Clears the cookie and, when the request carries a current admin session,
 * revokes every admin token issued so far (a copied token stops working
 * too). Without the database it can only clear the cookie.
 */
export const postAdminLogout = async (req: Request, res: Response) => {
  const token = sessionToken(req, 'admin');
  // Without the database, revoking would wait for a connection; only clear the cookie.
  if (token && isDatabaseReady()) {
    try {
      await endAdminSession(verifyAccessToken('admin', token));
    } catch (error) {
      if (!(error instanceof AppError)) log.warn('Admin logout: could not revoke the session', errorFields(error));
    }
  }
  res.clearCookie(AUTH_COOKIE_NAME, clearSessionCookieOptions(cookieSettings()));
  res.status(200).json({ success: true });
};

/**
 * GET /admin/auth/me
 * Returns the authenticated admin's email if the session is valid.
 * requireAdmin (applied in admin-auth.routes.ts) does all the actual
 * verification; this handler only runs for a valid admin session. Exists
 * specifically so dashboard/layout.tsx, a Server Component with no way
 * to verify a JWT itself, has something to call to ask "is this
 * visitor actually logged in."
 */
export const getAdminMe = async (req: Request, res: Response) => {
  res.status(200).json({ email: req.user!.email });
};