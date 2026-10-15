import { Router } from 'express';
import { getPharmacyItems, updatePharmacyStock } from '../controllers/pharmacyController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getPharmacyItems);
router.put('/:id/stock', authorize('ADMIN', 'BILLING_STAFF'), updatePharmacyStock);

export default router;
