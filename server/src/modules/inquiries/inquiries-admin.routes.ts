import { Router } from 'express';
import { requireAdmin } from '../admin/admin-session.js';
import { deleteInquiry, getInquiryStats, listInquiries, updateInquiry } from './inquiries.controller.js';

// Admin-only, every route: one blanket guard, as in admin/content.routes.ts.
// Mounted at /api/admin/inquiries (admin.routes.ts).
const router = Router();

router.use(requireAdmin);

router.get('/', listInquiries);
router.get('/stats', getInquiryStats);
router.patch('/:id', updateInquiry);
router.delete('/:id', deleteInquiry);

export default router;
