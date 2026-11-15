import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { ensureKnowledgeVectorIndex } from '../modules/ai-chat/ai-chat.model.js';
import { checkAllModels } from '../modules/ai-chat/llm.service.js';

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
  // wait on one that isn't answering (llm.service.ts, "Model health").
  checkAllModels();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});