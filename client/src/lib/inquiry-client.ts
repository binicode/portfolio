import { clientEnv } from './config';
import { sendResult, type InquiryFields, type SendResult } from './inquiry';

const TIMEOUT_MS = 15000;

export interface InquiryPayload extends InquiryFields {
  brief: string;
  transcript: Array<{ q: string; a: string[] }>;
  /** The form's hidden honeypot field; empty for real visitors. */
  website: string;
}

/** POST /inquiries. Never throws: a network failure or timeout is a 'failed' result. */
export async function sendInquiry(payload: InquiryPayload): Promise<SendResult> {
  try {
    const response = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Not JSON (a proxy error page): the status decides.
    }
    return sendResult(response.status, body);
  } catch {
    return { status: 'failed' };
  }
}
