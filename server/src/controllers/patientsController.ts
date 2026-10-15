import { Response, NextFunction } from 'express';
import { Patient } from '../models/Patient';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createPatientSchema } from '../validators/schemas';
import { buildSuccessResponse, buildPaginatedResponse, paginate, createAuditLog } from '../utils/helpers';

export async function getPatients(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const search = (req.query.search as string) || '';
  const filter: Record<string, unknown> = { isActive: true };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
    ];
  }

  const [patients, total] = await Promise.all([
    Patient.find(filter)
      .populate('registeredBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Patient.countDocuments(filter),
  ]);
  res.json(buildPaginatedResponse(patients, total, page, limit));
}

export async function getPatientById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const patient = await Patient.findById(req.params.id).populate('registeredBy', 'name');
  if (!patient || !patient.isActive) return next(new AppError('Patient not found', 404));
  res.json(buildSuccessResponse(patient));
}

export async function createPatient(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createPatientSchema)(req.body);
  const patient = await Patient.create({
    ...data,
    dob: new Date(data.dob),
    registeredBy: req.user!._id,
  });
  await createAuditLog(req, 'CREATE', 'Patient', patient._id.toString(), `Registered ${patient.name}`);
  res.status(201).json(buildSuccessResponse(patient, 'Patient registered'));
}

export async function updatePatient(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createPatientSchema.partial())(req.body);
  const patient = await Patient.findByIdAndUpdate(
    req.params.id,
    { $set: { ...data, ...(data.dob ? { dob: new Date(data.dob) } : {}) } },
    { new: true, runValidators: true }
  );
  if (!patient) return next(new AppError('Patient not found', 404));
  await createAuditLog(req, 'UPDATE', 'Patient', patient._id.toString(), `Updated ${patient.name}`);
  res.json(buildSuccessResponse(patient, 'Patient updated'));
}
