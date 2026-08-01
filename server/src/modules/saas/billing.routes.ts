import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { postCreateCheckoutSession } from './billing.controller.js';

const router = Router();

router.post('/checkout', requireAuth, requireRole('user'), postCreateCheckoutSession);

export default router;
