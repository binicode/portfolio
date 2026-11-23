import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../config/env.js';
import { verifiedSessionKey } from './auth.js';

/**
 * Signed-in requests count against their account; everything else against
 * the client IP (TRUST_PROXY makes that the visitor's, not a proxy's). The
 * account key matters for server-rendered pages: the Next server calls the
 * API for every visitor's dashboard from one address, so keyed by IP alone
 * all customers would share one bucket. A bad or expired token falls back
 * to the IP.
 */
function accountOrIp(req: Request): string {
  const account = verifiedSessionKey(req);
  return account ? `account:${account}` : `ip:${ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? '')}`;
}

/**
 * General-purpose limiter for most API routes. Generous enough not to
 * interfere with normal usage (dashboards polling, aggregator calls, etc.)
 * but still blocks abusive scraping/DoS patterns.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountOrIp,
  message: {
    error: {
      message: 'Too many requests. Please try again later.',
    },
  },
});

/**
 * Strict limiter for sensitive auth endpoints (login, signup, password
 * reset). Prevents brute-force credential guessing.
 *
 * Usage: router.post('/login', authLimiter, loginController)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * Account links: confirming an address, resetting a password, and asking
 * for either link again. The two that send email also wait a minute per
 * account between sends (saas-auth.controller.ts); this bounds what one
 * address can do across accounts, and the free email quota (100 a day).
 */
export const accountLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * Deleting an account asks for its password again. The caller is already
 * signed in, so this is keyed by account: a stolen session can't be used
 * to guess the password quickly.
 */
export const accountDeletionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountOrIp,
  message: {
    error: {
      message: 'Too many attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * Checkout and portal sessions create objects in Stripe: a person needs a
 * handful of tries at most. Keyed by account, since the routes are
 * signed-in only.
 */
export const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: accountOrIp,
  message: {
    error: {
      message: 'Too many billing requests. Please try again in 15 minutes.',
    },
  },
});

/**
 * Moderate limiter for the AI chat widget — protects against runaway
 * API costs (every request here triggers a paid LLM call), while still
 * allowing a real visitor to have a normal conversation.
 */
export const aiChatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: env.NODE_ENV === 'production' ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'You have reached the chat limit for now. Please try again shortly.',
    },
  },
});

/**
 * Project inquiries from the assistant's planner. A real visitor sends one
 * brief, maybe a corrected second; this stops one address filling the
 * admin inbox. The client offers the LinkedIn route on a 429.
 */
export const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'You have sent a few briefs already. Please try again later.',
    },
  },
});