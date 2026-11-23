import { env } from '../config/env.js';
import { log } from '../logger.js';

/**
 * Sends email through Resend's HTTP API (POST /emails) with fetch: no SDK.
 * Messages are plain text, so nothing a visitor typed can become markup.
 *
 * sendEmail never throws. A send that fails is logged (by kind and status,
 * never by address) and reported as false; callers decide whether that
 * matters. Without RESEND_API_KEY email is off; in development the message
 * is printed instead (and counts as sent), so links can be followed locally.
 */

export type EmailKind = 'inquiry-alert' | 'verify-email' | 'account-exists' | 'reset-password';

export interface EmailMessage {
  kind: EmailKind;
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/** Delivers one message; throws when it could not. */
export type EmailTransport = (message: EmailMessage, idempotencyKey: string) => Promise<void>;

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 1_000;

class EmailSendError extends Error {
  constructor(
    readonly status: number | null,
    readonly reason: string,
  ) {
    super(`email send failed: ${status ?? 'network'} ${reason}`);
  }
}

/** The request Resend expects. Pure, so it is tested without the network. */
export function resendRequest(
  message: EmailMessage,
  idempotencyKey: string,
  sender: { apiKey: string; from: string },
): { url: string; init: RequestInit } {
  const body: Record<string, unknown> = {
    from: sender.from,
    to: [message.to],
    subject: message.subject,
    text: message.text,
  };
  if (message.replyTo) body.reply_to = [message.replyTo];
  return {
    url: RESEND_EMAILS_URL,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sender.apiKey}`,
        'Content-Type': 'application/json',
        // Resend sends a message once per key within 24 hours, so a retry
        // after a lost response cannot deliver it twice.
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    },
  };
}

/** Resend's error name (e.g. "daily_quota_exceeded"); its message can repeat addresses. */
async function errorName(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { name?: unknown };
    return typeof body.name === 'string' ? body.name : 'unknown';
  } catch {
    return 'unreadable response';
  }
}

/**
 * One retry, a second later, for a network failure, a rate limit or a
 * server error; anything else (a bad sender, an unverified domain) fails at
 * once.
 */
export function resendTransport(
  sender: { apiKey: string; from: string },
  fetchImpl: typeof fetch = fetch,
  retryDelayMs = RETRY_DELAY_MS,
): EmailTransport {
  return async (message, idempotencyKey) => {
    const { url, init } = resendRequest(message, idempotencyKey, sender);
    let failure = new EmailSendError(null, 'not attempted');
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      let response: Response;
      try {
        response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
      } catch (error) {
        failure = new EmailSendError(null, error instanceof Error ? error.name : 'unknown');
        continue;
      }
      if (response.ok) return;
      failure = new EmailSendError(response.status, await errorName(response));
      if (response.status !== 429 && response.status < 500) break;
    }
    throw failure;
  };
}

let testTransport: EmailTransport | null = null;
let warnedOff = false;

/** Tests only: route every message to `transport` (null restores the default). */
export function setEmailTransportForTests(transport: EmailTransport | null): void {
  if (env.NODE_ENV !== 'test') throw new Error('setEmailTransportForTests is for tests only');
  testTransport = transport;
}

function configuredTransport(): EmailTransport | null {
  if (testTransport) return testTransport;
  if (env.RESEND_API_KEY && env.EMAIL_FROM) return resendTransport({ apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM });
  return null;
}

export async function sendEmail(message: EmailMessage, idempotencyKey: string): Promise<boolean> {
  const transport = configuredTransport();
  if (!transport) {
    if (env.NODE_ENV === 'development') {
      // Local runs: the console stands in for the inbox.
      console.log(`\n[email, printed because RESEND_API_KEY is not set]\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}\n`);
      return true;
    }
    if (!warnedOff) {
      warnedOff = true;
      log.warn('Email is off: RESEND_API_KEY or EMAIL_FROM is not set', { kind: message.kind });
    }
    return false;
  }
  try {
    await transport(message, idempotencyKey);
    return true;
  } catch (error) {
    const fields =
      error instanceof EmailSendError ? { kind: message.kind, status: error.status, reason: error.reason } : { kind: message.kind, reason: 'unexpected' };
    log.error('Email could not be sent', fields);
    return false;
  }
}
