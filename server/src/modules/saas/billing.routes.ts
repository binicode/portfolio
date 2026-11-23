import { Router } from 'express';
import { requireCustomer } from './customer-session.js';
import { checkoutLimiter } from '../../core/middleware/rateLimiter.js';
import { postCreateCheckoutSession } from './billing.controller.js';

const router = Router();

router.post('/checkout', requireCustomer, checkoutLimiter, postCreateCheckoutSession);

export default router;
