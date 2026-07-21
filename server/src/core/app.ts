import cors from 'cors';
import express, { type Application } from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export function createApp(): Application {
  const app = express();

  // --- Global middleware ---
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(generalLimiter);

  // --- Health check (no module, lives at root) ---
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  // --- Module routers get mounted here as each one is built ---
  // app.use('/api/ai-chat', aiChatRouter);
  // app.use('/api/admin', adminRouter);
  // app.use('/api/saas', saasRouter);
  // app.use('/api/aggregator', aggregatorRouter);
  // app.use('/api/storefront', storefrontRouter);

  // --- 404 + error handling MUST be last, in this order ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}