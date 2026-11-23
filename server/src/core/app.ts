import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { env } from './config/env.js';
import { corsOriginCheck, parseClientOrigins } from './config/origins.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { requestLog, requireDatabase, securityHeaders } from './middleware/http-hygiene.js';
import { isDatabaseReady } from './config/db.js';
import aiChatRouter from '../modules/ai-chat/ai-chat.routes.js';
import inquiriesRouter from '../modules/inquiries/inquiries.routes.js';
import adminRouter from '../modules/admin/admin.routes.js';
import projectsPublicRouter from '../modules/admin/projects-public.routes.js';
import saasAuthRouter from '../modules/saas/saas-auth.routes.js';
import billingRouter from '../modules/saas/billing.routes.js';
import aggregatorRouter from '../modules/saas/aggregator.routes.js';
import settingsRouter from '../modules/saas/settings.routes.js';
import { postStripeWebhook } from '../modules/saas/webhook.controller.js';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.use(securityHeaders(env.NODE_ENV === 'production'));
  app.use(requestLog);

  // Behind a proxy, req.ip (and every rate limit keyed on it) must be the
  // visitor's address, not the proxy's: TRUST_PROXY says how many proxies
  // to trust (core/config/trust-proxy.ts). Unset, nothing is trusted.
  app.set('trust proxy', env.TRUST_PROXY);

  // --- Global middleware ---
  app.use(
    cors({
      origin: corsOriginCheck(parseClientOrigins(env.CLIENT_ORIGIN)),
      credentials: true,
    })
  );

  // Stripe's webhook MUST be registered here, before express.json(),
  // with its own raw-body parser. Stripe signs the exact raw bytes it
  // sends — once express.json() below has parsed and re-serialized a
  // body, signature verification fails even for a genuine request.
  const database = requireDatabase(isDatabaseReady);
  app.post('/api/saas/billing/webhook', database, express.raw({ type: 'application/json' }), postStripeWebhook);

  app.use(express.json());
  app.use(cookieParser());
  app.use(generalLimiter);

  // --- Health check (no module): for the host's health probe and uptime
  // monitors. 200 while the process serves requests; the API keeps
  // serving without the database (the assistant falls back to built-in
  // notes), so a missing database is "degraded", not down. Also at
  // /api/health for hosts that route only /api to this service.
  const health: express.RequestHandler = (_req, res) => {
    const database = isDatabaseReady() ? 'connected' : 'unavailable';
    res.status(200).json({
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  };
  app.get('/health', health);
  app.get('/api/health', health);

  // --- Module routers get mounted here as each one is built ---
  app.use('/api/ai-chat', aiChatRouter);
  // Everything below the assistant needs MongoDB (the assistant has its own
  // fallbacks without it): sessions are checked against each account's token
  // version there (auth.ts). Logging out is the exception: it can always
  // clear the cookie, and revokes the session when the database is up.
  const databaseExceptLogout: express.RequestHandler = (req, res, next) =>
    req.path === '/logout' ? next() : database(req, res, next);
  app.use('/api/inquiries', database, inquiriesRouter);
  app.use('/api/admin/projects', database);
  app.use('/api/admin/inquiries', database);
  app.use('/api/admin/auth', databaseExceptLogout);
  app.use('/api/admin', adminRouter);
  app.use('/api/projects', database, projectsPublicRouter);
  app.use('/api/saas/auth', databaseExceptLogout, saasAuthRouter);
  app.use('/api/saas/billing', database, billingRouter);
  app.use('/api/saas/aggregator', database, aggregatorRouter);
  app.use('/api/saas/settings', database, settingsRouter);

  // --- 404 + error handling MUST be last, in this order ---
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
