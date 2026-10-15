import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createUserSchema, updateUserSchema } from '../validators/schemas';
import {
  buildSuccessResponse,
  buildPaginatedResponse,
  paginate,
  createAuditLog,
} from '../utils/helpers';

export async function getUsers(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const search = (req.query.search as string) || '';
  const role = req.query.role as string;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) filter.role = role;

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse(users, total, page, limit));
}

export async function getUserById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  res.json(buildSuccessResponse(user));
}

export async function createUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { password, ...rest } = validate(createUserSchema)(req.body);

  const existing = await User.findOne({ email: rest.email });
  if (existing) return next(new AppError('Email already in use', 409));

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ ...rest, passwordHash });

  await createAuditLog(req, 'CREATE', 'User', user._id.toString(), `Created user ${user.email}`);
  res.status(201).json(buildSuccessResponse(user.toJSON(), 'User created'));
}

export async function updateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(updateUserSchema)(req.body);

  // Prevent updating own account via this route
  if (req.params.id === req.user!._id.toString()) {
    return next(new AppError('Use /api/auth/profile to update your own profile', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!user) return next(new AppError('User not found', 404));

  await createAuditLog(req, 'UPDATE', 'User', user._id.toString(), `Updated user ${user.email}`);
  res.json(buildSuccessResponse(user.toJSON(), 'User updated'));
}

export async function deleteUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.params.id === req.user!._id.toString()) {
    return next(new AppError('Cannot deactivate your own account', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!user) return next(new AppError('User not found', 404));

  await createAuditLog(req, 'DEACTIVATE', 'User', user._id.toString(), `Deactivated ${user.email}`);
  res.json(buildSuccessResponse(null, 'User deactivated'));
}
