import { Router } from 'express';
import { login, registerCustomer, getMe, getDemoAccounts, switchUserDemo } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', registerCustomer);
router.get('/me', authenticate, getMe);
router.get('/demo-accounts', getDemoAccounts);
router.post('/switch-demo', switchUserDemo);

export default router;
