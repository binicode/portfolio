import { Router } from 'express';
import { aiChatLimiter } from '../../core/middleware/rateLimiter.js';
import { getChatHistory, postChatMessage } from './ai-chat.controller.js';

const router = Router();

// generalLimiter already applies globally (app.ts) to every route,
// including this one. aiChatLimiter layers on top of just the POST
// endpoint — that's the one costing real money per request (embedding +
// LLM generation); the GET history read is a cheap DB lookup.
router.post('/chat', aiChatLimiter, postChatMessage);
router.get('/chat/:sessionId', getChatHistory);

export default router;