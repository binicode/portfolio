import { Router } from 'express';
import { requireAdmin } from './admin-session.js';
import {
  createProject,
  listAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from './content.controller.js';

const router = Router();

// Every route in this router is admin-only, with no exceptions — a
// single blanket guard here is safer than repeating it on each line,
// where forgetting it on just one route would be a silent security hole.
router.use(requireAdmin);

router.post('/', createProject);
router.get('/', listAllProjects);
router.get('/:id', getProjectById);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;