import { Response, NextFunction } from 'express';
import { PharmacyItem } from '../models/PharmacyItem';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { buildSuccessResponse, buildPaginatedResponse, paginate } from '../utils/helpers';

export async function getPharmacyItems(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const { category, search, lowStock } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;
  if (lowStock === 'true') {
    filter.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    PharmacyItem.find(filter).skip(skip).limit(limit).sort({ name: 1 }),
    PharmacyItem.countDocuments(filter),
  ]);

  res.json(buildPaginatedResponse(items, total, page, limit));
}

export async function updatePharmacyStock(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  const { stockQuantity, unitPrice } = req.body;

  const item = await PharmacyItem.findById(id);
  if (!item) return next(new AppError('Pharmacy item not found', 404));

  if (stockQuantity !== undefined) item.stockQuantity = Number(stockQuantity);
  if (unitPrice !== undefined) item.unitPrice = Number(unitPrice);

  await item.save();
  res.json(buildSuccessResponse(item, 'Pharmacy inventory updated successfully'));
}
