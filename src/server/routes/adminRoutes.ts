import { Router } from 'express';
import {
  listDepartments,
  createDepartment,
  listCategories,
  createCategory,
  listSlaRules,
  updateSlaRule,
  listUsers,
  createUser,
  getAuditLogs,
} from '../controllers/adminController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Department & Category read access available to internal staff, edits to Admin/Manager
router.get('/departments', listDepartments);
router.post('/departments', requireRoles('ADMIN'), createDepartment);

router.get('/categories', listCategories);
router.post('/categories', requireRoles('ADMIN', 'MANAGER'), createCategory);

router.get('/sla-rules', listSlaRules);
router.put('/sla-rules/:id', requireRoles('ADMIN'), updateSlaRule);

router.get('/users', requireRoles('ADMIN', 'MANAGER'), listUsers);
router.post('/users', requireRoles('ADMIN'), createUser);

router.get('/audit-logs', requireRoles('ADMIN', 'MANAGER'), getAuditLogs);

export default router;
