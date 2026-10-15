import { Router } from 'express';
import { getInvoices, getInvoiceById, createInvoice, updateInvoice } from '../controllers/invoicesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'BILLING_STAFF'), getInvoices);
router.post('/', authorize('BILLING_STAFF', 'ADMIN'), createInvoice);
router.get('/:id', authorize('ADMIN', 'BILLING_STAFF'), getInvoiceById);
router.put('/:id', authorize('BILLING_STAFF', 'ADMIN'), updateInvoice);

export default router;
