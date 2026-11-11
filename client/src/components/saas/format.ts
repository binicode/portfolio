/** Number and date formatting for the Creator Dashboard (en-US, server-rendered). */

const full = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

/** Full digits: 1,284. */
export function formatCount(value: number): string {
  return full.format(value);
}

/** Full under 10,000, compact above it: 1,284 / 12.9K / 2.7M. */
export function formatFigure(value: number): string {
  return value < 10_000 ? full.format(value) : compact.format(value);
}

/** "Oct 29" (UTC, so server and reader agree on the day). */
export function formatShortDate(iso: string): string {
  return shortDate.format(new Date(iso));
}

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 days ago", "last month". `now` is passed in so rendering stays pure. */
export function formatTimeAgo(iso: string, now: number): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return 'just now';
}
