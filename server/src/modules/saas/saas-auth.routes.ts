import { Router } from 'express';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { requireCustomer } from './customer-session.js';
import { postRegister, postLogin, postLogout, getMe } from './saas-auth.controller.js';

const router = Router();

router.post('/register', authLimiter, postRegister);
router.post('/login', authLimiter, postLogin);
router.post('/logout', postLogout);
router.get('/me', requireCustomer, getMe);

export default router;