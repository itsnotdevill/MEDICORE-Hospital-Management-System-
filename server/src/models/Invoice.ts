import { Schema, model, Document, Types } from 'mongoose';

export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'INSURANCE' | 'ONLINE';

export interface IAdditionalCharge {
  description: string;
  amount: number;
}

export interface IInvoice extends Document {
  _id: Types.ObjectId;
  invoiceId: string;
  patientId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  consultationFee: number;
  additionalCharges: IAdditionalCharge[];
  discount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const additionalChargeSchema = new Schema<IAdditionalCharge>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceId: { type: String, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    consultationFee: { type: Number, required: true, min: 0 },
    additionalCharges: [additionalChargeSchema],
    discount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'],
      default: 'PENDING',
    },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'INSURANCE', 'ONLINE'] },
    paymentDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-generate invoiceId
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceId) {
    const count = await model('Invoice').countDocuments();
    let candidate = `INV-${String(count + 1).padStart(5, '0')}`;
    const exists = await model('Invoice').findOne({ invoiceId: candidate });
    if (exists) {
      candidate = `INV-${String(count + 1).padStart(5, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }
    this.invoiceId = candidate;
  }
  next();
});

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);
