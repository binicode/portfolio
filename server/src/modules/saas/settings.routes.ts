import { Router } from 'express';
import { requireCustomer } from './customer-session.js';
import { patchSettings } from './settings.controller.js';

const router = Router();

router.patch('/', requireCustomer, patchSettings);

export default router;
