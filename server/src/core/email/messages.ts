import type { EmailMessage } from './email.js';

/**
 * The text of every email the API sends. Plain text: links stay readable
 * and nothing a visitor typed can become markup. Subjects never include
 * visitor input except the enquirer's name (control characters are already
 * stripped by the inquiry schema).
 */

const SIGN_OFF = '— Biniyam';

export function inquiryAlert(input: {
  to: string;
  name: string;
  contact: { kind: 'email' | 'linkedin'; value: string };
  brief: string;
  adminUrl: string;
}): EmailMessage {
  const replyHint = input.contact.kind === 'email' ? 'Reply to this email to answer them directly.' : 'They asked for a reply on LinkedIn.';
  return {
    kind: 'inquiry-alert',
    to: input.to,
    subject: `New project brief from ${input.name}`,
    replyTo: input.contact.kind === 'email' ? input.contact.value : undefined,
    text: [
      `${input.name} sent a brief from the planner.`,
      `Contact: ${input.contact.value}`,
      replyHint,
      '',
      input.brief,
      '',
      `All briefs: ${input.adminUrl}`,
    ].join('\n'),
  };
}

export function verifyEmailMessage(to: string, link: string): EmailMessage {
  return {
    kind: 'verify-email',
    to,
    subject: 'Confirm your email for the Creator Dashboard',
    text: [
      'Confirm this address to finish setting up your Creator Dashboard account.',
      'Open the link and enter the password you chose when you signed up:',
      link,
      '',
      'The link works once, for 24 hours. Lost it? Sign up again for a new one.',
      "If you didn't sign up, ignore this email and nothing happens.",
      '',
      SIGN_OFF,
    ].join('\n'),
  };
}

/** Sent instead of a confirmation when someone signs up with an address that already has an account. */
export function accountExistsMessage(to: string, loginUrl: string, resetUrl: string): EmailMessage {
  return {
    kind: 'account-exists',
    to,
    subject: 'You already have a Creator Dashboard account',
    text: [
      'Someone tried to create a Creator Dashboard account with this address, which already has one.',
      '',
      `If it was you, log in: ${loginUrl}`,
      `Forgot your password? Reset it: ${resetUrl}`,
      '',
      "If it wasn't you, ignore this email. Your account hasn't changed.",
      '',
      SIGN_OFF,
    ].join('\n'),
  };
}

export function passwordResetMessage(to: string, link: string): EmailMessage {
  return {
    kind: 'reset-password',
    to,
    subject: 'Reset your Creator Dashboard password',
    text: [
      'Choose a new password for your Creator Dashboard account:',
      link,
      '',
      'The link works once, for 30 minutes. Setting a new password signs out every device.',
      "If you didn't ask for this, ignore this email. Your password stays the same.",
      '',
      SIGN_OFF,
    ].join('\n'),
  };
}
