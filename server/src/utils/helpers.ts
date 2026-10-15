import { Request } from 'express';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

export async function createAuditLog(
  req: AuthRequest,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
): Promise<void> {
  try {
    if (!req.user) return;
    await AuditLog.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (err) {
    // Audit log failures must not break the main request
    console.error('Audit log error:', err);
  }
}

export function paginate(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildSuccessResponse<T>(data: T, message?: string) {
  return { success: true, message, data };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
