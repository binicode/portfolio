import { Router } from 'express';
import { listPublishedProjects, getPublishedProjectBySlug } from './content.controller.js';

const router = Router();

// No auth guard — these are the public portfolio's own read endpoints,
// serving only projects marked published (enforced in
// content.controller.ts, not here). generalLimiter already covers this
// globally in app.ts; no LLM-style cost concern that would justify a
// stricter limiter the way aiChatLimiter does for the chat widget.
router.get('/', listPublishedProjects);
router.get('/:slug', getPublishedProjectBySlug);

export default router;