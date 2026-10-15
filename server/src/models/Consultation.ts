import { Schema, model, Document, Types } from 'mongoose';

export interface IPrescriptionItem {
  medicine: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

export interface IConsultation extends Document {
  _id: Types.ObjectId;
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  chiefComplaint: string;
  diagnosis: string;
  prescription: IPrescriptionItem[];
  labTests: string[];
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const consultationSchema = new Schema<IConsultation>(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chiefComplaint: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    prescription: [prescriptionItemSchema],
    labTests: [{ type: String, trim: true }],
    followUpDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export const Consultation = model<IConsultation>('Consultation', consultationSchema);
