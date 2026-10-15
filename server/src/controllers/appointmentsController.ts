import { Response, NextFunction } from 'express';
import { Appointment } from '../models/Appointment';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createAppointmentSchema, updateAppointmentSchema } from '../validators/schemas';
import { buildSuccessResponse, buildPaginatedResponse, paginate, createAuditLog } from '../utils/helpers';

export async function getAppointments(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const { status, doctorId, patientId, date } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};

  // Doctors can only see their own appointments
  if (req.user!.role === 'DOCTOR') {
    filter.doctorId = req.user!._id;
  } else if (doctorId) {
    filter.doctorId = doctorId;
  }

  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;
  if (date) {
    const d = new Date(date);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = { $gte: d, $lt: nextDay };
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'name patientId phone')
      .populate('doctorId', 'name')
      .populate('departmentId', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1, timeSlot: 1 }),
    Appointment.countDocuments(filter),
  ]);
  res.json(buildPaginatedResponse(appointments, total, page, limit));
}

export async function getAppointmentById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patientId', 'name patientId phone gender dob bloodGroup allergies')
    .populate('doctorId', 'name email')
    .populate('departmentId', 'name');
  if (!appointment) return next(new AppError('Appointment not found', 404));

  // Doctors can only see their own appointments
  if (
    req.user!.role === 'DOCTOR' &&
    appointment.doctorId._id.toString() !== req.user!._id.toString()
  ) {
    return next(new AppError('Access denied', 403));
  }

  res.json(buildSuccessResponse(appointment));
}

export async function createAppointment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createAppointmentSchema)(req.body);

  // Check for conflict
  const dateObj = new Date(data.date);
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);

  const conflict = await Appointment.findOne({
    doctorId: data.doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot: data.timeSlot,
    status: { $nin: ['CANCELLED'] },
  });
  if (conflict) {
    return next(new AppError('This time slot is already booked for the selected doctor', 409));
  }

  const appointment = await Appointment.create({
    ...data,
    date: new Date(data.date),
    createdBy: req.user!._id,
  });

  await createAuditLog(
    req,
    'CREATE',
    'Appointment',
    appointment._id.toString(),
    `Appointment ${appointment.appointmentId}`
  );
  res.status(201).json(buildSuccessResponse(appointment, 'Appointment scheduled'));
}

export async function updateAppointment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(updateAppointmentSchema)(req.body);
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!appointment) return next(new AppError('Appointment not found', 404));

  await createAuditLog(
    req,
    'UPDATE',
    'Appointment',
    appointment._id.toString(),
    `Status: ${appointment.status}`
  );
  res.json(buildSuccessResponse(appointment, 'Appointment updated'));
}

export async function deleteAppointment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'CANCELLED' },
    { new: true }
  );
  if (!appointment) return next(new AppError('Appointment not found', 404));

  await createAuditLog(req, 'CANCEL', 'Appointment', appointment._id.toString());
  res.json(buildSuccessResponse(null, 'Appointment cancelled'));
}
