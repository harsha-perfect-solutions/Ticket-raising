import { Router } from 'express';
import {
  listDepartments,
  createDepartment,
  deleteDepartment,
  listCategories,
  createCategory,
  deleteCategory,
  listSlaRules,
  createSlaRule,
  updateSlaRule,
  deleteSlaRule,
  listUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  resetUserPassword,
  getAuditLogs,
} from '../controllers/adminController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Department & Category read access available to internal staff, edits to Admin/Manager
router.get('/departments', listDepartments);
router.post('/departments', requireRoles('ADMIN', 'MANAGER'), createDepartment);
router.delete('/departments/:id', requireRoles('ADMIN', 'MANAGER'), deleteDepartment);

router.get('/categories', listCategories);
router.post('/categories', requireRoles('ADMIN', 'MANAGER'), createCategory);
router.delete('/categories/:id', requireRoles('ADMIN', 'MANAGER'), deleteCategory);

router.get('/sla-rules', listSlaRules);
router.post('/sla-rules', requireRoles('ADMIN'), createSlaRule);
router.put('/sla-rules/:id', requireRoles('ADMIN'), updateSlaRule);
router.delete('/sla-rules/:id', requireRoles('ADMIN'), deleteSlaRule);

router.get('/users', requireRoles('ADMIN', 'MANAGER'), listUsers);
router.post('/users', requireRoles('ADMIN'), createUser);
router.put('/users/:id', requireRoles('ADMIN'), updateUser);
router.patch('/users/:id/toggle-status', requireRoles('ADMIN'), toggleUserStatus);
router.post('/users/:id/reset-password', requireRoles('ADMIN'), resetUserPassword);
router.delete('/users/:id', requireRoles('ADMIN'), deleteUser);

router.get('/audit-logs', requireRoles('ADMIN', 'MANAGER'), getAuditLogs);

export default router;
