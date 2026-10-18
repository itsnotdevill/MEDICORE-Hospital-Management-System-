import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Doctor } from '../models/Doctor';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
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
    .populate('userId', 'name email phone isActive')
    .populate('departmentId', 'name');
  if (!doctor) return next(new AppError('Doctor not found', 404));
  res.json(buildSuccessResponse(doctor));
}

export async function createDoctor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const {
    name,
    email,
    password,
    phone,
    userId: providedUserId,
    departmentId,
    specialization,
    qualification,
    experience,
    consultationFee,
    schedule,
    bio,
  } = req.body;

  let targetUserId = providedUserId;

  // If name and email are provided, handle User creation or linking seamlessly
  if (!targetUserId && email && name) {
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      user.role = 'DOCTOR';
      if (!user.name) user.name = name.trim();
      if (phone && !user.phone) user.phone = phone.trim();
      user.isActive = true;
      user.authProvider = 'BOTH';
      await user.save();
      targetUserId = user._id.toString();
    } else {
      const initialPassword = password || 'Password123!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(initialPassword, salt);

      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'DOCTOR',
        phone: phone ? phone.trim() : undefined,
        isActive: true,
        authProvider: 'BOTH',
      });
      targetUserId = user._id.toString();
    }
  }

  if (!targetUserId) {
    return next(new AppError('Doctor name and email or existing userId are required', 400));
  }

  // Ensure user has DOCTOR role
  const user = await User.findById(targetUserId);
  if (!user || user.role !== 'DOCTOR') {
    return next(new AppError('User must exist and have DOCTOR role', 400));
  }

  // Check if doctor profile already exists for this user
  const existing = await Doctor.findOne({ userId: targetUserId });
  if (existing) {
    return next(new AppError('A doctor profile already exists for this staff member', 409));
  }

  if (!departmentId) {
    return next(new AppError('Department ID is required', 400));
  }

  const doctorData = {
    userId: targetUserId,
    departmentId,
    specialization: specialization || 'General Medicine',
    qualification: qualification || 'MBBS',
    experience: Number(experience) || 0,
    consultationFee: Number(consultationFee) || 500,
    schedule: Array.isArray(schedule) && schedule.length > 0 ? schedule : [
      { day: 'MON', startTime: '09:00', endTime: '13:00' },
      { day: 'WED', startTime: '09:00', endTime: '13:00' },
      { day: 'FRI', startTime: '14:00', endTime: '18:00' },
    ],
    bio: bio || '',
  };

  const doctor = await Doctor.create(doctorData);
  const populatedDoctor = await Doctor.findById(doctor._id)
    .populate('userId', 'name email phone isActive')
    .populate('departmentId', 'name');

  await createAuditLog(
    req,
    'CREATE',
    'Doctor',
    doctor._id.toString(),
    `Created doctor profile for Dr. ${user.name} (${user.email})`
  );

  res.status(201).json(buildSuccessResponse(populatedDoctor, 'Doctor profile registered successfully'));
}

export async function updateDoctor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { name, phone, email, ...doctorFields } = req.body;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new AppError('Doctor not found', 404));

  if (name || phone || email) {
    await User.findByIdAndUpdate(doctor.userId, {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email: email.toLowerCase().trim() }),
    });
  }

  const updatedDoctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { $set: doctorFields },
    { new: true, runValidators: true }
  )
    .populate('userId', 'name email phone isActive')
    .populate('departmentId', 'name');

  await createAuditLog(req, 'UPDATE', 'Doctor', doctor._id.toString(), 'Doctor profile updated');
  res.json(buildSuccessResponse(updatedDoctor, 'Doctor profile updated'));
}

export async function deleteDoctor(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return next(new AppError('Doctor not found', 404));

  await Doctor.findByIdAndDelete(req.params.id);
  await createAuditLog(req, 'DELETE', 'Doctor', doctor._id.toString(), 'Doctor profile removed');
  res.json(buildSuccessResponse(null, 'Doctor profile removed successfully'));
}
