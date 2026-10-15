import { Response, NextFunction } from 'express';
import { WardBed } from '../models/WardBed';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { buildSuccessResponse } from '../utils/helpers';

export async function getBeds(req: AuthRequest, res: Response): Promise<void> {
  const { wardType, status } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (wardType) filter.wardType = wardType;
  if (status) filter.status = status;

  const beds = await WardBed.find(filter)
    .populate('currentPatientId', 'name patientId phone')
    .populate('assignedDoctorId', 'name')
    .sort({ wardType: 1, bedNumber: 1 });

  // Calculate summary stats
  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE').length;
  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;

  res.json({
    success: true,
    data: beds,
    summary: { totalBeds, availableBeds, occupiedBeds },
  });
}

export async function updateBedStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  const { status, currentPatientId, assignedDoctorId, notes } = req.body;

  const bed = await WardBed.findById(id);
  if (!bed) return next(new AppError('Ward bed not found', 404));

  if (status) bed.status = status;
  if (currentPatientId !== undefined) bed.currentPatientId = currentPatientId || undefined;
  if (assignedDoctorId !== undefined) bed.assignedDoctorId = assignedDoctorId || undefined;
  if (notes !== undefined) bed.notes = notes;
  if (status === 'OCCUPIED' && !bed.admittedAt) bed.admittedAt = new Date();
  if (status === 'AVAILABLE') {
    bed.currentPatientId = undefined;
    bed.assignedDoctorId = undefined;
    bed.admittedAt = undefined;
  }

  await bed.save();
  res.json(buildSuccessResponse(bed, 'Bed status updated successfully'));
}
