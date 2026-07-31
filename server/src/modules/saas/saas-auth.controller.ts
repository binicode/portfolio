import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../core/config/env.js';
import { AppError, asyncHandler } from '../../core/middleware/errorHandler.js';
import { signAccessToken, SAAS_AUTH_COOKIE_NAME } from '../../core/middleware/auth.js';
import { SaasUserModel } from './saas-user.model.js';
import type { AuthResult } from './saas.types.js';

const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * POST /saas/auth/register
 * Creates a new SaasUser and immediately logs them in via the same
 * httpOnly cookie as login — a fresh signup shouldn't have to submit
 * the login form a second time right after registering. Relies on the
 * schema's unique index on email to reject duplicates; Mongoose's
 * 11000 error is already handled by errorHandler.ts with a 409, so no
 * separate pre-check is needed here.
 */
export const postRegister = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = registerBodySchema.parse(req.body);

  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await SaasUserModel.create({
    email,
    passwordHash,
    subscriptionStatus: 'none',
  });

  const token = signAccessToken({
    sub: user._id.toString(),
    role: 'user',
    email: user.email,
  });

  res.cookie(SAAS_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  });

  const result: AuthResult = { success: true };
  res.status(201).json(result);
});

/**
 * POST /saas/auth/login
 */
export const postLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = loginBodySchema.parse(req.body);

  const user = await SaasUserModel.findOne({ email: email.toLowerCase() });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signAccessToken({
    sub: user._id.toString(),
    role: 'user',
    email: user.email,
  });

  res.cookie(SAAS_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  });

  const result: AuthResult = { success: true };
  res.status(200).json(result);
});

/**
 * POST /saas/auth/logout
 */
export const postLogout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(SAAS_AUTH_COOKIE_NAME);
  res.status(200).json({ success: true });
});

/**
 * GET /saas/auth/me
 * Queries the current subscriptionStatus fresh from the database on
 * every call rather than trusting the JWT's claims — see file header
 * note on why that field can't be baked into the token.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await SaasUserModel.findById(req.user!.sub);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
  });
});
