import { Router } from 'express';
import { searchCustomers, createCustomer, getCustomerById } from '../controllers/customerController';
import { authenticate, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Telecallers, Agents, Managers, and Admins can search & create customers
router.get('/search', requireRoles('ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'), searchCustomers);
router.post('/', requireRoles('ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'), createCustomer);
router.get('/:id', requireRoles('ADMIN', 'MANAGER', 'AGENT', 'TELECALLER'), getCustomerById);

export default router;
