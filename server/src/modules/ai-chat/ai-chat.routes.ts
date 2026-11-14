import { Router } from 'express';
import { aiChatLimiter } from '../../core/middleware/rateLimiter.js';
import { getChatHistory, postChatMessage } from './ai-chat.controller.js';
import { postDiscovery } from './discovery.js';

const router = Router();

// generalLimiter already applies globally (app.ts) to every route,
// including this one. aiChatLimiter layers on top of just the POST
// endpoint — that's the one costing real money per request (embedding +
// LLM generation); the GET history read is a cheap DB lookup.
router.post('/chat', aiChatLimiter, postChatMessage);
router.get('/chat/:sessionId', getChatHistory);
// Project discovery: same model cost as a chat turn, so the same limiter.
router.post('/discovery', aiChatLimiter, postDiscovery);

export default router;