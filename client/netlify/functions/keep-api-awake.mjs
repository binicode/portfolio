/**
 * Keeps the API awake. Render's free instance sleeps after 15 minutes
 * without traffic and then takes about a minute to answer, longer than the
 * site waits for it (10 s, src/lib/fetch-timeout.ts). A request to /health
 * every 10 minutes keeps the one free service up, within Render's 750 free
 * hours a month (docs/deploy.md).
 *
 * A Netlify scheduled function: it runs only on the published production
 * deploy and can't be called by URL.
 */
const HEALTH_URL = 'https://api.biniyam.com/health';

export default async function keepApiAwake() {
  try {
    const response = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(25_000) });
    console.log(`API health: ${response.status}`);
  } catch (error) {
    console.log(`API health check failed: ${error instanceof Error ? error.name : 'unknown error'}`);
  }
}

export const config = { schedule: '*/10 * * * *' };
