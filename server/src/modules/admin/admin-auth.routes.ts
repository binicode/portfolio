import { Router } from 'express';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { requireAdmin } from './admin-session.js';
import { postAdminLogin, postAdminLogout, getAdminMe } from './admin-auth.controller.js';

const router = Router();

router.post('/login', authLimiter, postAdminLogin);
router.post('/logout', postAdminLogout);
router.get('/me', requireAdmin, getAdminMe);

export default router;