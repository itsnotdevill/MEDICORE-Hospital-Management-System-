import { Router } from 'express';
import { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor } from '../controllers/doctorsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', authorize('ADMIN'), createDoctor);
router.put('/:id', authorize('ADMIN'), updateDoctor);
router.delete('/:id', authorize('ADMIN'), deleteDoctor);

export default router;
