import { Router } from 'express';
import adminAuthRoutes from './admin-auth.routes.js';
import contentRoutes from './content.routes.js';
import inquiriesAdminRoutes from '../inquiries/inquiries-admin.routes.js';

const router = Router();

// Composes the admin surface into one router: POST /login under /auth,
// full CRUD under /projects, planner inquiries under /inquiries. Mounted
// once at /api/admin in app.ts.
router.use('/auth', adminAuthRoutes);
router.use('/projects', contentRoutes);
router.use('/inquiries', inquiriesAdminRoutes);

export default router;