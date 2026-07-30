import { Router } from 'express';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { postAdminLogin, postAdminLogout, getAdminMe } from './admin-auth.controller.js';

const router = Router();

router.post('/login', authLimiter, postAdminLogin);
router.post('/logout', postAdminLogout);
router.get('/me', requireAuth, requireRole('admin'), getAdminMe);

export default router;