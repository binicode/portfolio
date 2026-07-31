import { Router } from 'express';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { postRegister, postLogin, postLogout, getMe } from './saas-auth.controller.js';

const router = Router();

router.post('/register', authLimiter, postRegister);
router.post('/login', authLimiter, postLogin);
router.post('/logout', postLogout);
router.get('/me', requireAuth, requireRole('user'), getMe);

export default router;