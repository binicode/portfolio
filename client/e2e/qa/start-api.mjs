// Starts the real Express API (server/) for the QA run.
//
// Provider keys come from the server's env file (QA_SERVER_ENV_FILE, default
// server/.env), so Gemini, Voyage, GitHub, YouTube and Stripe test mode are
// real. Everything that decides identity or where data goes is overridden
// here with the QA run's test values (passed in by playwright.qa.config.ts).
// Node gives variables already in the environment precedence over
// --env-file, and the server's dotenv call never overrides them either.

import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '../../../server');
const require = createRequire(path.join(serverDir, 'package.json'));
const bcrypt = require('bcryptjs');

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`start-api.mjs: ${name} is not set (run through playwright.qa.config.ts)`);
  return value;
};

const mongoUri = required('QA_MONGODB_URI');
// The QA run writes test users and projects: never anywhere but this machine.
const host = new URL(mongoUri.replace(/^mongodb(\+srv)?:/, 'http:')).hostname;
if (mongoUri.startsWith('mongodb+srv:') || !['127.0.0.1', 'localhost', '[::1]'].includes(host)) {
  throw new Error(`start-api.mjs: QA_MONGODB_URI must point at this machine, got host "${host}"`);
}

const envFile = process.env.QA_SERVER_ENV_FILE ?? path.join(serverDir, '.env');
const args = [];
if (existsSync(envFile)) {
  args.push(`--env-file=${envFile}`);
} else {
  console.warn(`start-api.mjs: no env file at ${envFile}; without provider keys the AI answers fall back to built-in text`);
}
args.push('--import', 'tsx', 'src/core/server.ts');

// The API's log is evidence for the report (which Gemini model answered,
// whether the database was used), kept with the media. Anything shaped like
// a provider key is redacted before it is written.
const logFile = path.resolve(here, '../../../portfolio-media/reports/raw/api.log');
mkdirSync(path.dirname(logFile), { recursive: true });
const log = createWriteStream(logFile, { flags: 'a' });
log.write(`\n===== API started ${new Date().toISOString()} =====\n`);
const redact = (text) =>
  text
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]')
    .replace(/\b(sk|rk|pk)_(test|live)_[0-9A-Za-z]+/g, '[redacted]')
    .replace(/whsec_[0-9A-Za-z_]+/g, '[redacted]')
    .replace(/\bpa-[0-9A-Za-z_-]{20,}/g, '[redacted]')
    .replace(/\bgh[pousr]_[0-9A-Za-z]{20,}/g, '[redacted]');

const child = spawn(process.execPath, args, {
  cwd: serverDir,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: required('QA_API_PORT'),
    CLIENT_ORIGIN: required('QA_BASE_URL'),
    MONGODB_URI: mongoUri,
    JWT_SECRET: required('QA_JWT_SECRET'),
    ADMIN_EMAIL: required('QA_ADMIN_EMAIL'),
    ADMIN_PASSWORD_HASH: bcrypt.hashSync(required('QA_ADMIN_PASSWORD'), 10),
    STRIPE_WEBHOOK_SECRET: required('QA_STRIPE_WEBHOOK_SECRET'),
  },
});

for (const stream of [child.stdout, child.stderr]) {
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    const clean = redact(chunk);
    process.stdout.write(clean);
    log.write(clean);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code) => process.exit(code ?? 0));
