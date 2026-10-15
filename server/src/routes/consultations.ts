import { Router } from 'express';
import {
  getConsultationByAppointment,
  createConsultation,
  updateConsultation,
} from '../controllers/consultationsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/appointment/:appointmentId', authorize('ADMIN', 'DOCTOR'), getConsultationByAppointment);
router.post('/', authorize('DOCTOR'), createConsultation);
router.put('/:id', authorize('DOCTOR'), updateConsultation);

export default router;
