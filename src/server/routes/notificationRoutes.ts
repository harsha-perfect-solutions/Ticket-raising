import { Router } from 'express';
import {
  listUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', listUserNotifications);
router.patch('/:id/read', markNotificationRead);
router.post('/mark-all-read', markAllNotificationsRead);

export default router;
