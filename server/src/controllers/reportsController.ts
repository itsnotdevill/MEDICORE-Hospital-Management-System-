import { Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Patient } from '../models/Patient';
import { Invoice } from '../models/Invoice';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';
import { buildSuccessResponse, buildPaginatedResponse, paginate } from '../utils/helpers';

export async function getDashboardStats(_req: AuthRequest, res: Response): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    totalAppointments,
    todayAppointments,
    totalRevenue,
    pendingInvoices,
    totalDoctors,
    appointmentsByStatus,
    revenueByMonth,
  ] = await Promise.all([
    Patient.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Invoice.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    Invoice.countDocuments({ status: 'PENDING' }),
    User.countDocuments({ role: 'DOCTOR', isActive: true }),
    Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: 'PAID' } },
      {
        $group: {
          _id: { year: { $year: '$paymentDate' }, month: { $month: '$paymentDate' } },
          revenue: { $sum: '$paidAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json(
    buildSuccessResponse({
      totalPatients,
      totalAppointments,
      todayAppointments,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingInvoices,
      totalDoctors,
      appointmentsByStatus,
      revenueByMonth,
    })
  );
}

export async function getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const [logs, total] = await Promise.all([
    AuditLog.find()
      .populate('userId', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 }),
    AuditLog.countDocuments(),
  ]);
  res.json(buildPaginatedResponse(logs, total, page, limit));
}
