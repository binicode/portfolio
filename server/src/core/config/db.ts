import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Force Node.js to use Google's Public DNS to bypass local querySrv blocks
dns.setServers(['8.8.8.8', '8.8.4.4']);

let isConnected = false;
let listenersAttached = false;
let retryTimer: NodeJS.Timeout | null = null;

// Reconnection after a failed start: 15 s, doubling, capped at 2 minutes.
const FIRST_RETRY_MS = 15_000;
const MAX_RETRY_MS = 120_000;

/** True while MongoDB is connected and usable. */
export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

function attachListeners(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('MongoDB: connected');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB: connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB: disconnected');
    isConnected = false;
  });
}

function scheduleRetry(delayMs: number): void {
  if (retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
      isConnected = true;
    } catch {
      console.warn(`MongoDB: still unreachable, retrying in ${Math.round(Math.min(delayMs * 2, MAX_RETRY_MS) / 1000)} s`);
      scheduleRetry(Math.min(delayMs * 2, MAX_RETRY_MS));
    }
  }, delayMs);
  // A pending retry must not keep the process alive on shutdown.
  retryTimer.unref();
}

/**
 * Connects to MongoDB. Resolves true when connected. If the first attempt
 * fails, the server still starts (features that don't need the database,
 * such as project discovery, keep working, and the chat falls back to the
 * in-code knowledge base and in-memory history) and the connection is
 * retried in the background. Routes that need the database fail with an
 * error until it connects. Previously a failed start exited the process.
 */
export async function connectDB(): Promise<boolean> {
  if (isConnected) {
    console.log('MongoDB: reusing existing connection');
    return true;
  }

  attachListeners();

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
    });
    isConnected = true;
    return true;
  } catch (err) {
    const reason = err instanceof Error ? err.message.split('\n')[0] : String(err);
    console.error(
      `MongoDB: initial connection failed (${reason}). Starting without the database and retrying in the background. ` +
        "On a local machine this is usually Atlas's Network Access list: add this machine's IP address.",
    );
    scheduleRetry(FIRST_RETRY_MS);
    return false;
  }
}

export async function disconnectDB(): Promise<void> {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB: disconnected gracefully');
}

// Graceful shutdown on process termination signals
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});
