import { log } from './logger.js';

/**
 * Runs work after the response has been sent, so its duration can't be
 * measured from outside (sign-up and password-reset requests answer the
 * same, at the same speed, whether or not an account exists) and the
 * visitor never waits for it. A failure is logged by name only: database
 * errors can quote the values involved, such as an email address.
 */
export function inBackground(what: string, task: () => Promise<unknown>): void {
  task().catch((error: unknown) => {
    log.error(`${what} failed`, { reason: error instanceof Error ? error.name : 'unknown' });
  });
}
