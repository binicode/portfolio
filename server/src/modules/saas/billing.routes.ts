import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { checkoutLimiter } from '../../core/middleware/rateLimiter.js';
import { postCreateCheckoutSession } from './billing.controller.js';

const router = Router();

router.post('/checkout', requireAuth, requireRole('user'), checkoutLimiter, postCreateCheckoutSession);

export default router;
