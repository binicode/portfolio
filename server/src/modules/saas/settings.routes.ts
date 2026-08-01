import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { patchSettings } from './settings.controller.js';

const router = Router();

router.patch('/', requireAuth, requireRole('user'), patchSettings);

export default router;
