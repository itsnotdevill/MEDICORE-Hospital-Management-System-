import { Router } from 'express';
import { getDashboardStats, getAuditLogs } from '../controllers/reportsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.get('/audit-logs', getAuditLogs);

export default router;
