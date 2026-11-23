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

/**
 * Fields for a caught error: its name and the start of its message. Never
 * the error object itself, which can carry request data.
 */
export function errorFields(error: unknown): Fields {
  if (error instanceof Error) return { error: error.name, detail: error.message.split('\n')[0].slice(0, 300) };
  return { error: typeof error };
}

export const log = {
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
};
