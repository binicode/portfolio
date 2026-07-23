import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { AppError, asyncHandler } from '../../core/middleware/errorHandler.js';
import { signAccessToken } from '../../core/middleware/auth.js';
import type { AdminLoginInput, AdminLoginResult } from './admin.types.js';

const adminLoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /admin/login
 * Validates credentials against the single hardcoded admin identity
 * defined in env (ADMIN_EMAIL / ADMIN_PASSWORD_HASH) and issues a JWT
 * with the 'admin' role on success. There is no registration endpoint
 * and no User collection — this app has exactly one admin, configured
 * at deploy time via environment variables.
 */
export const postAdminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password }: AdminLoginInput = adminLoginBodySchema.parse(req.body);

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

  const result: AdminLoginResult = { token };
  res.status(200).json(result);
});