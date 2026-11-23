/**
 * The real API against a real MongoDB, for tests that need the database.
 *
 * Starts an in-memory MongoDB (mongodb-memory-server downloads the binary
 * once and caches it), sets the environment the API reads at import, then
 * imports and starts the app on a free port. Call it before anything else
 * imports the app: the environment is read once, at import.
 *
 * Each test file runs in its own process (Node's test runner), so the
 * environment set here never leaks into another file.
 */
import bcrypt from 'bcryptjs';
import type { AddressInfo } from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const ADMIN = { email: 'admin@example.com', password: 'admin-password-for-tests' };

export interface ApiResponse {
  status: number;
  body: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** The `name=value` part of the first Set-Cookie header, if any. */
  cookie?: string;
}

export interface DatabaseApp {
  call(path: string, init?: RequestInit, cookie?: string): Promise<ApiResponse>;
  post(path: string, body: unknown, cookie?: string): Promise<ApiResponse>;
  patch(path: string, body: unknown, cookie?: string): Promise<ApiResponse>;
  stop(): Promise<void>;
}

export async function startDatabaseApp(overrides: Record<string, string> = {}): Promise<DatabaseApp> {
  const mongo = await MongoMemoryServer.create();

  // Everything the API reads, set explicitly, so a developer's server/.env
  // never supplies real provider keys or another database to a test.
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri('portfolio-test'),
    DNS_SERVERS: '',
    JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
    ADMIN_EMAIL: ADMIN.email,
    ADMIN_PASSWORD_HASH: bcrypt.hashSync(ADMIN.password, 4),
    CLIENT_ORIGIN: 'http://localhost:3000',
    TRUST_PROXY: '',
    COOKIE_DOMAIN: '',
    GEMINI_API_KEY: '',
    VOYAGE_API_KEY: '',
    STRIPE_SECRET_KEY: '',
    STRIPE_WEBHOOK_SECRET: '',
    STRIPE_PRO_PRICE_ID: '',
    GITHUB_API_TOKEN: '',
    YOUTUBE_API_KEY: '',
    ...overrides,
  });

  // If anything below fails, stop the database: a running mongod would keep
  // the test process alive, and the run would hang instead of failing.
  let started;
  try {
    const { connectDB, disconnectDB } = await import('../core/config/db.js');
    const { createApp } = await import('../core/app.js');
    if (!(await connectDB())) throw new Error('test database did not connect');
    const server = createApp().listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    started = { server, disconnectDB };
  } catch (error) {
    await mongo.stop();
    throw error;
  }
  const { server, disconnectDB } = started;
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const call: DatabaseApp['call'] = async (path, init = {}, cookie) => {
    const response = await fetch(base + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...init.headers },
    });
    const text = await response.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {
      // Not JSON (an empty 204, for example): keep the text.
    }
    return { status: response.status, body, cookie: response.headers.get('set-cookie')?.split(';')[0] };
  };

  return {
    call,
    post: (path, body, cookie) => call(path, { method: 'POST', body: JSON.stringify(body) }, cookie),
    patch: (path, body, cookie) => call(path, { method: 'PATCH', body: JSON.stringify(body) }, cookie),
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await disconnectDB();
      await mongo.stop();
    },
  };
}
