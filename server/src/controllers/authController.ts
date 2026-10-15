import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, loginSchema, registerSchema, changePasswordSchema, updateProfileSchema } from '../validators/schemas';
import { buildSuccessResponse, createAuditLog } from '../utils/helpers';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { email, password } = validate(loginSchema)(req.body);

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.isActive) {
    return next(new AppError('Invalid email or password', 401));
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return next(new AppError('Invalid email or password', 401));
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  res.cookie('token', token, COOKIE_OPTIONS);

  const userData = user.toJSON();
  res.json(buildSuccessResponse(userData, 'Login successful'));
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { name, email, password, role, phone } = validate(registerSchema)(req.body);

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('An account with this email address already exists', 409));
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'RECEPTIONIST',
    phone,
    isActive: true,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  res.cookie('token', token, COOKIE_OPTIONS);

  const userData = user.toJSON();
  res.status(201).json(buildSuccessResponse(userData, 'Registration successful. Welcome to MediCore HMS!'));
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'strict',
  });
  res.json(buildSuccessResponse(null, 'Logged out successfully'));
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  res.json(buildSuccessResponse(req.user!.toJSON()));
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(updateProfileSchema)(req.body);
  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!user) return next(new AppError('User not found', 404));

  await createAuditLog(req, 'UPDATE', 'User', user._id.toString(), 'Profile updated');
  res.json(buildSuccessResponse(user.toJSON(), 'Profile updated'));
}

export async function changePassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { currentPassword, newPassword } = validate(changePasswordSchema)(req.body);

  const user = await User.findById(req.user!._id).select('+passwordHash');
  if (!user) return next(new AppError('User not found', 404));

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) return next(new AppError('Current password is incorrect', 400));

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  await createAuditLog(req, 'CHANGE_PASSWORD', 'User', user._id.toString(), 'Password changed');
  res.json(buildSuccessResponse(null, 'Password changed successfully'));
}
