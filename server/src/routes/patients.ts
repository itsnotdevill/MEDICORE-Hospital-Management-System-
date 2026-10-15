import { Router } from 'express';
import { getPatients, getPatientById, createPatient, updatePatient } from '../controllers/patientsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', authorize('ADMIN', 'RECEPTIONIST'), getPatients);
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), createPatient);
router.get('/:id', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), getPatientById);
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST'), updatePatient);

export default router;
