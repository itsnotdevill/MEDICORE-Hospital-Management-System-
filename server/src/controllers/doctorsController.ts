import { Response, NextFunction } from 'express';
import { Doctor } from '../models/Doctor';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createDoctorSchema } from '../validators/schemas';
import { buildSuccessResponse, buildPaginatedResponse, paginate, createAuditLog } from '../utils/helpers';

export async function getDoctors(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const departmentId = req.query.departmentId as string;
  const filter: Record<string, unknown> = {};
  if (departmentId) filter.departmentId = departmentId;

  const [doctors, total] = await Promise.all([
    Doctor.find(filter)
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name')
      .skip(skip)
      .limit(limit),
    Doctor.countDocuments(filter),
  ]);
  res.json(buildPaginatedResponse(doctors, total, page, limit));
}

export async function getDoctorById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone')
    .populate('departmentId', 'name');
  if (!doctor) return next(new AppError('Doctor not found', 404));
  res.json(buildSuccessResponse(doctor));
}

export async function createDoctor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createDoctorSchema)(req.body);

  // Ensure the user exists and is a DOCTOR role
  const user = await User.findById(data.userId);
  if (!user || user.role !== 'DOCTOR') {
    return next(new AppError('User must exist and have DOCTOR role', 400));
  }

  const existing = await Doctor.findOne({ userId: data.userId });
  if (existing) return next(new AppError('Doctor profile already exists for this user', 409));

  const doctor = await Doctor.create(data);
  await createAuditLog(req, 'CREATE', 'Doctor', doctor._id.toString(), `Doctor profile for ${user.name}`);
  res.status(201).json(buildSuccessResponse(doctor, 'Doctor profile created'));
}

export async function updateDoctor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createDoctorSchema.partial())(req.body);
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { $set: data },
    { new: true, runValidators: true }
  ).populate('userId', 'name email');
  if (!doctor) return next(new AppError('Doctor not found', 404));
  await createAuditLog(req, 'UPDATE', 'Doctor', doctor._id.toString(), 'Doctor profile updated');
  res.json(buildSuccessResponse(doctor, 'Doctor profile updated'));
}
