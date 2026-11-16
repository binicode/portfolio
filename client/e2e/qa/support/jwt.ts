import { createHmac } from 'node:crypto';
import { QA } from '../settings';

const b64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

/**
 * Signs an HS256 JWT like the API's signAccessToken, with any secret, so
 * tests can present forged, expired or wrong-role tokens. Uses the QA run's
 * test secret unless told otherwise; never a real one.
 */
export function signToken(
  payload: Record<string, unknown>,
  { secret = QA.jwtSecret, expiresInSeconds = 3600, alg = 'HS256' }: { secret?: string; expiresInSeconds?: number; alg?: 'HS256' | 'none' } = {},
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg, typ: 'JWT' }));
  const body = b64url(JSON.stringify({ iat: now, exp: now + expiresInSeconds, ...payload }));
  if (alg === 'none') return `${header}.${body}.`;
  const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/** Signs a Stripe webhook payload the way Stripe does (t=..., v1=HMAC-SHA256). */
export function stripeSignature(payload: string, secret: string = QA.stripeWebhookSecret, timestamp = Math.floor(Date.now() / 1000)): string {
  const v1 = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${v1}`;
}
