import { Schema, model, Document, Types } from 'mongoose';

export type WardType = 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE_AC' | 'ICU' | 'EMERGENCY' | 'RECOVERY';
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';

export interface IWardBed extends Document {
  _id: Types.ObjectId;
  bedNumber: string;
  wardType: WardType;
  floor: number;
  roomNumber: string;
  dailyRate: number;
  status: BedStatus;
  currentPatientId?: Types.ObjectId;
  assignedDoctorId?: Types.ObjectId;
  admittedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const wardBedSchema = new Schema<IWardBed>(
  {
    bedNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    wardType: {
      type: String,
      enum: ['GENERAL', 'SEMI_PRIVATE', 'PRIVATE_AC', 'ICU', 'EMERGENCY', 'RECOVERY'],
      required: true,
    },
    floor: { type: Number, required: true },
    roomNumber: { type: String, required: true, trim: true },
    dailyRate: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING'],
      default: 'AVAILABLE',
    },
    currentPatientId: { type: Schema.Types.ObjectId, ref: 'Patient' },
    assignedDoctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    admittedAt: { type: Date },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

wardBedSchema.index({ bedNumber: 1, wardType: 1, status: 1 });

export const WardBed = model<IWardBed>('WardBed', wardBedSchema);
