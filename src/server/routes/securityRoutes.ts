import { Router } from 'express';
import { getAntivirusStats, getFileScanStatus, triggerManualRescan } from '../controllers/securityController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/antivirus-stats', authenticate, getAntivirusStats);
router.get('/scans/:fileId', authenticate, getFileScanStatus);
router.post('/rescan/:fileId', authenticate, triggerManualRescan);

export default router;
