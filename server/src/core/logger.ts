/**
 * One log line per event. In production each line is JSON (level, time,
 * message and fields), so a host's log search can filter on fields; in
 * development it stays readable. Callers pass ids, routes and timings,
 * never email addresses, message text, tokens or request bodies.
 */
type Level = 'info' | 'warn' | 'error';
type Fields = Record<string, string | number | boolean | null | undefined>;

const json = process.env.NODE_ENV === 'production';

function write(level: Level, message: string, fields: Fields = {}): void {
  const line = json
    ? JSON.stringify({ level, time: new Date().toISOString(), msg: message, ...fields })
    : `${message}${Object.keys(fields).length ? ' ' + Object.entries(fields).map(([k, v]) => `${k}=${v}`).join(' ') : ''}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
};
