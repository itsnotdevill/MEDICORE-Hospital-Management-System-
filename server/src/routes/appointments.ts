import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), getAppointments);
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), createAppointment);
router.get('/:id', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), getAppointmentById);
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), updateAppointment);
router.delete('/:id', authorize('ADMIN'), deleteAppointment);

export default router;
