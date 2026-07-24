import { Router } from 'express';
import { requireAuth, requireRole } from '../../core/middleware/auth.js';
import {
  createProject,
  listAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from './content.controller.js';

const router = Router();

// Every route in this router is admin-only, with no exceptions — a
// single blanket guard here is safer than repeating requireAuth +
// requireRole('admin') on each line individually, where forgetting it
// on just one route would be a silent security hole.
router.use(requireAuth, requireRole('admin'));

router.post('/', createProject);
router.get('/', listAllProjects);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;