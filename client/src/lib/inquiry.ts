/**
 * Sending a project brief from the planner (server: modules/inquiries).
 * Pure, so it can be tested with `node --test`: field checks for instant
 * feedback, and how a response becomes what the visitor sees. The server
 * validates again and is the authority.
 */

export const NAME_MAX = 80;
export const CONTACT_MAX = 254;

export type ContactKind = 'email' | 'linkedin';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The server's pattern: linkedin.com/in/<handle>, with or without scheme, www or a country subdomain.
const LINKEDIN = /^(?:https?:\/\/)?(?:(?:www|[a-z]{2})\.)?linkedin\.com\/in\/[\p{L}\p{N}_%-]{3,100}\/?(?:[?#]\S*)?$/iu;

export function contactKind(value: string): ContactKind | null {
  const text = value.trim();
  if (!text || text.length > CONTACT_MAX) return null;
  if (EMAIL.test(text)) return 'email';
  return LINKEDIN.test(text) ? 'linkedin' : null;
}

export interface InquiryFields {
  name: string;
  contact: string;
}

export type InquiryErrors = Partial<Record<keyof InquiryFields, string>>;

export function validateInquiry({ name, contact }: InquiryFields): InquiryErrors {
  const errors: InquiryErrors = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = 'Add your name.';
  else if (trimmed.length > NAME_MAX) errors.name = `Use ${NAME_MAX} characters or fewer.`;
  if (!contact.trim()) errors.contact = 'Add an email address or a LinkedIn profile link.';
  else if (!contactKind(contact)) errors.contact = 'Enter an email address or a LinkedIn profile link.';
  return errors;
}

export type SendResult =
  | { status: 'sent' }
  /** Something the visitor can fix in the form. */
  | { status: 'invalid'; errors: InquiryErrors }
  | { status: 'limited' }
  | { status: 'failed' };

/**
 * A response as the form's next state. A rejected brief or transcript is
 * nothing the visitor can fix, so it counts as a failure (LinkedIn fallback).
 */
export function sendResult(status: number, body: unknown): SendResult {
  if (status >= 200 && status < 300) return { status: 'sent' };
  if (status === 429) return { status: 'limited' };
  if (status === 400) {
    const details = (body as { error?: { details?: Record<string, unknown> } } | null)?.error?.details ?? {};
    const errors: InquiryErrors = {};
    for (const field of ['name', 'contact'] as const) {
      const messages = details[field];
      if (Array.isArray(messages) && typeof messages[0] === 'string') errors[field] = messages[0];
    }
    if (Object.keys(errors).length > 0) return { status: 'invalid', errors };
  }
  return { status: 'failed' };
}
