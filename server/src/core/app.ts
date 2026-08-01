import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import aiChatRouter from '../modules/ai-chat/ai-chat.routes.js';
import adminRouter from '../modules/admin/admin.routes.js';
import projectsPublicRouter from '../modules/admin/projects-public.routes.js';
import saasAuthRouter from '../modules/saas/saas-auth.routes.js';
import billingRouter from '../modules/saas/billing.routes.js';
import { postStripeWebhook } from '../modules/saas/webhook.controller.js';

export function createApp(): Application {
  const app = express();

  // --- Global middleware ---
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );

  // Stripe's webhook MUST be registered here, before express.json(),
  // with its own raw-body parser. Stripe signs the exact raw bytes it
  // sends — once express.json() below has parsed and re-serialized a
  // body, signature verification fails even for a genuine request.
  // Registering this exact path first means it's handled completely
  // here and never falls through to the JSON parser below.
  app.post('/api/saas/billing/webhook', express.raw({ type: 'application/json' }), postStripeWebhook);

  app.use(express.json());
  app.use(cookieParser());
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
  app.use('/api/ai-chat', aiChatRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/projects', projectsPublicRouter);
  app.use('/api/saas/auth', saasAuthRouter);
  app.use('/api/saas/billing', billingRouter);
  // app.use('/api/aggregator', aggregatorRouter);
  // app.use('/api/storefront', storefrontRouter);

  // --- 404 + error handling MUST be last, in this order ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
