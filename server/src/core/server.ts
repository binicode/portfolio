import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { log } from './logger.js';
import { ensureKnowledgeVectorIndex } from '../modules/ai-chat/ai-chat.model.js';
import { checkAllModels } from '../modules/ai-chat/llm.service.js';

// A deploy sends SIGTERM and usually waits about 10 to 30 seconds before
// killing the process. In-flight requests (a streaming answer) get this
// long to finish; then the process exits regardless.
const SHUTDOWN_GRACE_MS = 10_000;

async function bootstrap(): Promise<void> {
  const databaseReady = await connectDB();

  // A failure here (e.g. the Atlas cluster tier doesn't support Vector
  // Search, or a driver version mismatch) is local to the ai-chat
  // module — it should not prevent the rest of the server, including
  // unrelated modules, from booting. Logged as a warning, not fatal.
  // Without a database (connectDB retries in the background) the check is
  // skipped; the chat uses the in-code knowledge base meanwhile.
  if (databaseReady) {
    try {
      await ensureKnowledgeVectorIndex();
    } catch (err) {
      console.warn(
        '⚠️  ai-chat: failed to ensure vector search index — chat retrieval may not work until this is resolved',
        err,
      );
    }
  }

  // Check the Gemini models in the background, so the first visitors don't
  // wait on one that isn't answering (model-health.ts).
  checkAllModels();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    log.info('server listening', { port: env.PORT, env: env.NODE_ENV });
  });

  let stopping = false;
  const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    log.info('shutting down', { signal });
    const force = setTimeout(() => {
      log.warn('shutdown timed out; exiting with requests still open');
      process.exit(1);
    }, SHUTDOWN_GRACE_MS);
    force.unref();
    // Stop accepting connections, let open requests finish, close idle
    // keep-alive sockets, then release the database.
    server.close(async () => {
      await disconnectDB().catch(() => undefined);
      log.info('shutdown complete');
      process.exit(0);
    });
    server.closeIdleConnections();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
