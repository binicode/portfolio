import type { RequestHandler } from 'express';
import { log } from '../logger.js';

/**
 * Response headers for a JSON-only API: nothing here is a page, so nothing
 * may run, be embedded or be framed, and responses are never sniffed as
 * another type. HSTS only in production (HTTPS); locally it would pin
 * localhost to HTTPS.
 */
export function securityHeaderValues(production: boolean): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    'Cross-Origin-Opener-Policy': 'same-origin',
    ...(production ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' } : {}),
  };
}

export function securityHeaders(production: boolean): RequestHandler {
  const headers = Object.entries(securityHeaderValues(production));
  return (_req, res, next) => {
    for (const [name, value] of headers) res.setHeader(name, value);
    next();
  };
}

const ID_SEGMENT = /^(?:[0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** The path as logged: no query string, and ids (ObjectId, UUID) replaced by ":id". */
export function routeForLog(originalUrl: string): string {
  const path = originalUrl.split('?')[0] ?? '/';
  return path
    .split('/')
    .map((segment) => (ID_SEGMENT.test(segment) ? ':id' : segment))
    .join('/');
}

/** One line per request: method, route, status and time. No IPs, bodies, cookies or query strings. */
export const requestLog: RequestHandler = (req, res, next) => {
  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const fields = { method: req.method, route: routeForLog(req.originalUrl), status: res.statusCode, ms: Math.round(ms) };
    if (res.statusCode >= 500) log.error('request', fields);
    else log.info('request', fields);
  });
  next();
};

/**
 * For routes that need MongoDB: answer 503 at once while it is down,
 * instead of letting Mongoose hold the request for its 10-second buffer
 * and then fail with a 500. The Next server's fetches fail fast and show
 * their fallback; Stripe retries a 503 webhook later.
 */
export function requireDatabase(isReady: () => boolean): RequestHandler {
  return (_req, res, next) => {
    if (isReady()) {
      next();
      return;
    }
    res.setHeader('Retry-After', '30');
    res.status(503).json({ error: { message: 'The service is temporarily unavailable. Try again shortly.' } });
  };
}
