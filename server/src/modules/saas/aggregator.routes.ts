import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { requireActiveSubscription } from './require-active-subscription.middleware.js';
import { getAggregatorStats } from './aggregator.controller.js';

const router = Router();

router.get('/', requireAuth, requireRole('user'), requireActiveSubscription, getAggregatorStats);

export default router;
