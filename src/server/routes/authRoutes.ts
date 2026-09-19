import { Router } from 'express';
import {
  login,
  registerCustomer,
  getMe,
  getDemoAccounts,
  switchUserDemo,
  forgotPassword,
  resetPassword,
  verifyMfaLogin,
  setupMfa,
  confirmEnableMfa,
  getMfaStatus,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/mfa/verify', verifyMfaLogin);
router.get('/mfa/status', authenticate, getMfaStatus);
router.post('/mfa/setup', authenticate, setupMfa);
router.post('/mfa/enable', authenticate, confirmEnableMfa);
router.post('/register', registerCustomer);
router.get('/me', authenticate, getMe);
router.get('/demo-accounts', getDemoAccounts);
router.post('/switch-demo', switchUserDemo);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
