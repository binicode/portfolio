import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureKnowledgeVectorIndex } from '../modules/ai-chat/ai-chat.model.js';

async function bootstrap(): Promise<void> {
  await connectDB();

  // A failure here (e.g. the Atlas cluster tier doesn't support Vector
  // Search, or a driver version mismatch) is local to the ai-chat
  // module — it should not prevent the rest of the server, including
  // unrelated modules, from booting. Logged as a warning, not fatal.
  try {
    await ensureKnowledgeVectorIndex();
  } catch (err) {
    console.warn(
      '⚠️  ai-chat: failed to ensure vector search index — chat retrieval may not work until this is resolved',
      err,
    );
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});