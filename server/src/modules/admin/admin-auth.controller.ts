import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { AppError } from '../../core/middleware/errorHandler.js';
import { signAccessToken, AUTH_COOKIE_NAME } from '../../core/middleware/auth.js';
import type { AdminLoginResult } from './admin.types.js';
import { clearSessionCookieOptions, sessionCookieOptions } from '../../core/config/session-cookie.js';

const cookieSettings = () => ({ production: env.NODE_ENV === 'production', domain: env.COOKIE_DOMAIN });

const adminLoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Matches signAccessToken's default expiresIn of '7d'.

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

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH) {
    throw new AppError('Server misconfiguration: admin credentials are not set', 500);
  }

  const emailMatches = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  const passwordMatches = emailMatches
    ? await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH)
    : false;

  if (!emailMatches || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signAccessToken({
    sub: 'admin',
    role: 'admin',
    email: env.ADMIN_EMAIL,
  });

  res.cookie(AUTH_COOKIE_NAME, token, sessionCookieOptions(cookieSettings()));

  const result: AdminLoginResult = { success: true };
  res.status(200).json(result);
};

/**
 * POST /admin/logout
 * Clears the session cookie. A stateless JWT can't be revoked
 * server-side without a denylist — unnecessary complexity for a
 * single-admin app, since clearing the cookie is sufficient: the
 * browser simply stops sending it.
 */
export const postAdminLogout = async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, clearSessionCookieOptions(cookieSettings()));
  res.status(200).json({ success: true });
};

/**
 * GET /admin/auth/me
 * Returns the authenticated admin's email if the session is valid.
 * requireAuth + requireRole('admin') (applied in admin-auth.routes.ts)
 * do all the actual verification — this handler only ever runs if
 * those middleware already confirmed a valid admin session. Exists
 * specifically so dashboard/layout.tsx, a Server Component with no way
 * to verify a JWT itself, has something to call to ask "is this
 * visitor actually logged in."
 */
export const getAdminMe = async (req: Request, res: Response) => {
  res.status(200).json({ email: req.user!.email });
};