import { Response, NextFunction } from 'express';
import { Invoice } from '../models/Invoice';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { validate, createInvoiceSchema, updateInvoiceSchema } from '../validators/schemas';
import { buildSuccessResponse, buildPaginatedResponse, paginate, createAuditLog } from '../utils/helpers';

export async function getInvoices(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = paginate(req.query as any);
  const { status, patientId } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate('patientId', 'name patientId')
      .populate('appointmentId', 'appointmentId date timeSlot')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Invoice.countDocuments(filter),
  ]);
  res.json(buildPaginatedResponse(invoices, total, page, limit));
}

export async function getInvoiceById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const invoice = await Invoice.findById(req.params.id)
    .populate('patientId', 'name patientId phone address')
    .populate('appointmentId', 'appointmentId date timeSlot type')
    .populate('createdBy', 'name');
  if (!invoice) return next(new AppError('Invoice not found', 404));
  res.json(buildSuccessResponse(invoice));
}

export async function createInvoice(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(createInvoiceSchema)(req.body);

  const existing = await Invoice.findOne({ appointmentId: data.appointmentId });
  if (existing) return next(new AppError('Invoice already exists for this appointment', 409));

  const additionalTotal = (data.additionalCharges || []).reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const totalAmount = data.consultationFee + additionalTotal - (data.discount || 0);

  const invoice = await Invoice.create({
    ...data,
    totalAmount,
    createdBy: req.user!._id,
  });

  await createAuditLog(req, 'CREATE', 'Invoice', invoice._id.toString(), `Invoice ${invoice.invoiceId}`);
  res.status(201).json(buildSuccessResponse(invoice, 'Invoice created'));
}

export async function updateInvoice(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const data = validate(updateInvoiceSchema)(req.body);
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return next(new AppError('Invoice not found', 404));
  if (invoice.status === 'CANCELLED') return next(new AppError('Cannot update a cancelled invoice', 400));

  // Recalculate total if charges change
  let totalAmount = invoice.totalAmount;
  if (data.additionalCharges !== undefined) {
    const additionalTotal = data.additionalCharges.reduce((sum, c) => sum + c.amount, 0);
    totalAmount = invoice.consultationFee + additionalTotal - (data.discount ?? invoice.discount);
  }

  // Auto-set status based on payment
  let status = data.status || invoice.status;
  if (data.paidAmount !== undefined) {
    if (data.paidAmount >= totalAmount) status = 'PAID';
    else if (data.paidAmount > 0) status = 'PARTIAL';
  }

  const updated = await Invoice.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        ...data,
        totalAmount,
        status,
        ...(data.paidAmount && data.paidAmount > 0 ? { paymentDate: new Date() } : {}),
      },
    },
    { new: true, runValidators: true }
  );

  await createAuditLog(req, 'UPDATE', 'Invoice', invoice._id.toString(), `Payment status: ${status}`);
  res.json(buildSuccessResponse(updated, 'Invoice updated'));
}
