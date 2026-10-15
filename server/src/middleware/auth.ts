import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  userId: string;
  role: UserRole;
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.token;

  if (!token) {
    return next(new AppError('Authentication required', 401));
  }

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }

  const user = await User.findById(payload.userId).select('+passwordHash');
  if (!user || !user.isActive) {
    return next(new AppError('User not found or deactivated', 401));
  }

  req.user = user;
  next();
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
