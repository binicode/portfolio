import { Router } from 'express';
import { authLimiter } from '../../core/middleware/rateLimiter.js';
import { postAdminLogin } from './admin-auth.controller.js';

const router = Router();

// Strict rate limiting here specifically — this is the one route in
// the app protecting the entire CMS behind it.
router.post('/login', authLimiter, postAdminLogin);

export default router;