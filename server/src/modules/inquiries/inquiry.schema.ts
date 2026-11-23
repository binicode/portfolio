import { z } from 'zod';
import { clean, transcriptSchema } from '../ai-chat/discovery.prompt.js';

/**
 * Validation for a project inquiry: the brief a visitor sends from the
 * assistant's planner, with their name and one way to reply. Pure: no
 * database, SDK or config imports, so it can be tested on its own.
 */

export const NAME_MAX = 80;
export const CONTACT_MAX = 254;
export const BRIEF_MAX = 4000;
/** Inquiries are deleted automatically this long after they arrive (TTL index). */
export const RETENTION_DAYS = 365;

/** The brief keeps its line breaks (## headings, - items); other control characters become spaces. */
export function cleanMultiline(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    // Stripping control characters is the point here.
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type Contact = { kind: 'email'; value: string } | { kind: 'linkedin'; value: string };

const email = z.string().email();
// linkedin.com/in/<handle>, with or without scheme, www or a country subdomain.
const LINKEDIN = /^(?:https?:\/\/)?(?:(?:www|[a-z]{2})\.)?linkedin\.com\/in\/([\p{L}\p{N}_%-]{3,100})\/?(?:[?#]\S*)?$/iu;

/**
 * An email address, or a LinkedIn profile link rebuilt from its handle
 * (so the stored link always points at linkedin.com). Anything else: null.
 */
export function parseContact(raw: string): Contact | null {
  const value = clean(raw);
  if (!value || value.length > CONTACT_MAX) return null;
  if (email.safeParse(value).success) return { kind: 'email', value };
  const match = LINKEDIN.exec(value);
  return match ? { kind: 'linkedin', value: `https://www.linkedin.com/in/${match[1]}` } : null;
}

/** Hidden form field real visitors never see. Bots that fill every field fill it too. */
export const HONEYPOT_FIELD = 'website';

export function isHoneypotFilled(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false;
  const value = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof value === 'string' ? value.trim().length > 0 : value !== undefined && value !== null;
}

export const inquiryBodySchema = z.object({
  name: z
    .string({ required_error: 'Add your name.' })
    .max(NAME_MAX * 4)
    .transform((value) => clean(value).replace(/\s{2,}/g, ' '))
    .pipe(z.string().min(1, 'Add your name.').max(NAME_MAX, `Use ${NAME_MAX} characters or fewer.`)),
  contact: z
    .string({ required_error: 'Add an email address or a LinkedIn profile link.' })
    .max(CONTACT_MAX * 2)
    .transform((value, ctx) => {
      const contact = parseContact(value);
      if (!contact) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter an email address or a LinkedIn profile link.' });
        return z.NEVER;
      }
      return contact;
    }),
  brief: z
    .string()
    .max(BRIEF_MAX * 2)
    .transform(cleanMultiline)
    .pipe(z.string().min(1).max(BRIEF_MAX)),
  transcript: transcriptSchema,
});

export type InquiryBody = z.infer<typeof inquiryBodySchema>;
