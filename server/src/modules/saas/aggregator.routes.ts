import { Router } from 'express';
import { requireCustomer } from './customer-session.js';
import { requireActiveSubscription } from './require-active-subscription.middleware.js';
import { getAggregatorStats } from './aggregator.controller.js';

const router = Router();

router.get('/', requireCustomer, requireActiveSubscription, getAggregatorStats);

export default router;
