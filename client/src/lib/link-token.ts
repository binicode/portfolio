import { useSyncExternalStore } from 'react';

/**
 * The token in an emailed link (/saas/verify-email#token=..., and the reset
 * link). It travels in the URL fragment, which browsers never send to a
 * server or put in a Referer, so it stays out of hosting logs.
 *
 * undefined while rendering on the server (the fragment isn't known yet),
 * null when the link has no token, otherwise the token.
 */
export function useLinkToken(): string | null | undefined {
  return useSyncExternalStore(subscribe, readToken, () => undefined);
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function readToken(): string | null {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}
