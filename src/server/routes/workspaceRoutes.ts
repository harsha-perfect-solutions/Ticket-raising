import { Router } from 'express';
import { listWorkspaces, createWorkspace, getWorkspaceStats } from '../controllers/workspaceController';
import { authenticate } from '../middleware/auth';
import { tenantIsolationMiddleware } from '../middleware/tenantIsolation';

const router = Router();

router.use(tenantIsolationMiddleware);

router.get('/', authenticate, listWorkspaces);
router.post('/', authenticate, createWorkspace);
router.get('/stats', authenticate, getWorkspaceStats);

export default router;
