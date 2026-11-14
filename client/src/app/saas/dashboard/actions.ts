'use server';

import { refresh } from 'next/cache';

/**
 * Re-renders the dashboard for the caller with fresh provider numbers.
 *
 * The new tree comes back in this action's response, so the client applies it
 * in the same transition that awaits the call: the pending state ends when
 * the new numbers are on screen, and a failed request rejects the call.
 * Nothing here reads or writes data: the page's own server components fetch
 * stats with the caller's session, so access is enforced exactly as on page
 * load.
 */
export async function refreshDashboard(): Promise<void> {
  refresh();
}
