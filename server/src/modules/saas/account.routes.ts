import { Router } from 'express';
import { accountDeletionLimiter } from '../../core/middleware/rateLimiter.js';
import { requireCustomer } from './customer-session.js';
import { deleteAccount } from './account.controller.js';

const router = Router();

router.delete('/', requireCustomer, accountDeletionLimiter, deleteAccount);

export default router;
