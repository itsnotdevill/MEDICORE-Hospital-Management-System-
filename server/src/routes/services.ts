import { Router } from 'express';
import { getServices, createService } from '../controllers/servicesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getServices);
router.post('/', authorize('ADMIN'), createService);

export default router;
