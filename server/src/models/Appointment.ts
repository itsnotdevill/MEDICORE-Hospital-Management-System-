import { Schema, model, Document, Types } from 'mongoose';

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY';

export interface IAppointment extends Document {
  _id: Types.ObjectId;
  appointmentId: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  departmentId: Types.ObjectId;
  date: Date;
  timeSlot: string; // "10:00"
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: { type: String, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      default: 'SCHEDULED',
    },
    type: {
      type: String,
      enum: ['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY'],
      required: true,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto-generate appointmentId
appointmentSchema.pre('save', async function (next) {
  if (!this.appointmentId) {
    const count = await model('Appointment').countDocuments();
    let candidate = `A-${String(count + 1).padStart(5, '0')}`;
    const exists = await model('Appointment').findOne({ appointmentId: candidate });
    if (exists) {
      candidate = `A-${String(count + 1).padStart(5, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }
    this.appointmentId = candidate;
  }
  next();
});

// Compound unique index to prevent double-booking
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $nin: ['CANCELLED'] } },
  }
);

export const Appointment = model<IAppointment>('Appointment', appointmentSchema);
