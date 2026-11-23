import { Router } from 'express';
import { inquiryLimiter } from '../../core/middleware/rateLimiter.js';
import { postInquiry } from './inquiries.controller.js';

// Public: a visitor sends their brief. Mounted at /api/inquiries in app.ts.
const router = Router();

router.post('/', inquiryLimiter, postInquiry);

export default router;
