import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

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