import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import { deleteInquiry, getInquiryStats, listInquiries, updateInquiry } from './inquiries.controller.js';

// Admin-only, every route: one blanket guard, as in admin/content.routes.ts.
// Mounted at /api/admin/inquiries (admin.routes.ts), so requireAuth reads
// the admin_token cookie.
const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', listInquiries);
router.get('/stats', getInquiryStats);
router.patch('/:id', updateInquiry);
router.delete('/:id', deleteInquiry);

export default router;
