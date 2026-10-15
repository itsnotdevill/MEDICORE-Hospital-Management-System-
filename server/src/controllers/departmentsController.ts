import { Response, NextFunction } from 'express';
import { Department } from '../models/Department';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createDepartmentSchema } from '../validators/schemas';
import { buildSuccessResponse, buildPaginatedResponse, paginate, createAuditLog } from '../utils/helpers';

export async function getDepartments(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const [departments, total] = await Promise.all([
    Department.find({ isActive: true })
      .populate('headDoctorId', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    Department.countDocuments({ isActive: true }),
  ]);
  res.json(buildPaginatedResponse(departments, total, page, limit));
}

export async function createDepartment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createDepartmentSchema)(req.body);
  const department = await Department.create(data);
  await createAuditLog(req, 'CREATE', 'Department', department._id.toString(), department.name);
  res.status(201).json(buildSuccessResponse(department, 'Department created'));
}

export async function updateDepartment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createDepartmentSchema)(req.body);
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!department) return next(new AppError('Department not found', 404));
  await createAuditLog(req, 'UPDATE', 'Department', department._id.toString(), department.name);
  res.json(buildSuccessResponse(department, 'Department updated'));
}

export async function deleteDepartment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!department) return next(new AppError('Department not found', 404));
  await createAuditLog(req, 'DELETE', 'Department', department._id.toString(), department.name);
  res.json(buildSuccessResponse(null, 'Department deactivated'));
}
