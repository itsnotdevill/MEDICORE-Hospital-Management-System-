import { Router } from 'express';
import { getBeds, updateBedStatus } from '../controllers/bedsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getBeds);
router.put('/:id/status', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), updateBedStatus);

export default router;
