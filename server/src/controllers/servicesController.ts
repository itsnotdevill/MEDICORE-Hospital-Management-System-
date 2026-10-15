import { Response, NextFunction } from 'express';
import { HospitalService } from '../models/HospitalService';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { buildSuccessResponse, buildPaginatedResponse, paginate } from '../utils/helpers';

export async function getServices(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const { category, search } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const [services, total] = await Promise.all([
    HospitalService.find(filter).skip(skip).limit(limit).sort({ category: 1, name: 1 }),
    HospitalService.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse(services, total, page, limit));
}

export async function createService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { code, name, category, description, price, departmentId } = req.body;
  if (!code || !name || !category || price === undefined) {
    return next(new AppError('Code, name, category, and price are required', 400));
  }

  const existing = await HospitalService.findOne({ code: code.toUpperCase() });
  if (existing) return next(new AppError('Service code already exists', 409));

  const service = await HospitalService.create({
    code: code.toUpperCase(),
    name,
    category,
    description,
    price: Number(price),
    departmentId: departmentId || undefined,
  });

  res.status(201).json(buildSuccessResponse(service, 'Hospital service created successfully'));
}
