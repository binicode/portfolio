import type { CookieOptions } from 'express';

/**
 * The admin and SaaS session cookies' attributes, in one place, so setting
 * and clearing always match (a cookie is only cleared by the same name,
 * domain and path). Pure, so it is tested without the environment
 * (session-cookie.test.ts).
 *
 * COOKIE_DOMAIN: with the site on example.com and the API on
 * api.example.com, a host-only cookie set by the API never reaches the
 * site's server, which reads it to render the dashboards. Setting
 * COOKIE_DOMAIN=example.com shares it between the two hosts. Locally it is
 * unnecessary: cookies ignore ports, so localhost:3000 and localhost:4000
 * already share them.
 */

export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const DOMAIN = /^\.?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;

export function parseCookieDomain(value: string | undefined): string | undefined {
  const domain = value?.trim();
  if (!domain) return undefined;
  if (!DOMAIN.test(domain)) throw new Error(`"${domain}" is not a domain (for example example.com, without a scheme or path)`);
  return domain.replace(/^\./, '').toLowerCase();
}

export interface SessionCookieSettings {
  production: boolean;
  domain?: string;
}

export function sessionCookieOptions({ production, domain }: SessionCookieSettings): CookieOptions {
  return {
    httpOnly: true,
    secure: production,
    sameSite: 'strict',
    path: '/',
    ...(domain ? { domain } : {}),
    maxAge: SESSION_MAX_AGE_MS,
  };
}

/** The same attributes without an expiry (Express sets the expiry itself when clearing). */
export function clearSessionCookieOptions(settings: SessionCookieSettings): CookieOptions {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { maxAge, ...rest } = sessionCookieOptions(settings);
  return rest;
}
