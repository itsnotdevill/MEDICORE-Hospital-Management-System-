import { Response, NextFunction } from 'express';
import { Consultation } from '../models/Consultation';
import { Appointment } from '../models/Appointment';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createConsultationSchema } from '../validators/schemas';
import { buildSuccessResponse, createAuditLog } from '../utils/helpers';

export async function getConsultationByAppointment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const consultation = await Consultation.findOne({
    appointmentId: req.params.appointmentId,
  })
    .populate('patientId', 'name patientId dob gender bloodGroup allergies')
    .populate('doctorId', 'name');

  if (!consultation) return next(new AppError('Consultation not found', 404));

  // Doctor can only see their own consultations
  if (
    req.user!.role === 'DOCTOR' &&
    consultation.doctorId._id.toString() !== req.user!._id.toString()
  ) {
    return next(new AppError('Access denied', 403));
  }

  res.json(buildSuccessResponse(consultation));
}

export async function createConsultation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createConsultationSchema)(req.body);

  const appointment = await Appointment.findById(data.appointmentId);
  if (!appointment) return next(new AppError('Appointment not found', 404));

  // Doctor can only create consultation for their own appointment
  if (appointment.doctorId.toString() !== req.user!._id.toString()) {
    return next(new AppError('You can only create consultations for your own appointments', 403));
  }

  const existing = await Consultation.findOne({ appointmentId: data.appointmentId });
  if (existing) return next(new AppError('Consultation already exists for this appointment', 409));

  const consultation = await Consultation.create({
    ...data,
    patientId: appointment.patientId,
    doctorId: req.user!._id,
    ...(data.followUpDate ? { followUpDate: new Date(data.followUpDate) } : {}),
  });

  // Mark appointment as completed
  await Appointment.findByIdAndUpdate(data.appointmentId, { status: 'COMPLETED' });

  await createAuditLog(
    req,
    'CREATE',
    'Consultation',
    consultation._id.toString(),
    `Consultation for appointment ${appointment.appointmentId}`
  );
  res.status(201).json(buildSuccessResponse(consultation, 'Consultation saved'));
}

export async function updateConsultation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createConsultationSchema.partial())(req.body);

  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) return next(new AppError('Consultation not found', 404));

  if (consultation.doctorId.toString() !== req.user!._id.toString()) {
    return next(new AppError('You can only update your own consultations', 403));
  }

  const updated = await Consultation.findByIdAndUpdate(
    req.params.id,
    { $set: data },
    { new: true, runValidators: true }
  );

  await createAuditLog(req, 'UPDATE', 'Consultation', consultation._id.toString());
  res.json(buildSuccessResponse(updated, 'Consultation updated'));
}
