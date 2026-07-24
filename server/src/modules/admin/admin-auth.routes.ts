import { Router } from 'express';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { postAdminLogin, postAdminLogout } from './admin-auth.controller.js';

const router = Router();

router.post('/login', authLimiter, postAdminLogin);
router.post('/logout', postAdminLogout);

export default router;