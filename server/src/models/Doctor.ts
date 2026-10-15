import { Schema, model, Document, Types } from 'mongoose';

export interface IScheduleSlot {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface IDoctor extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  departmentId: Types.ObjectId;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  schedule: IScheduleSlot[];
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scheduleSlotSchema = new Schema<IScheduleSlot>(
  {
    day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    experience: { type: Number, required: true, min: 0 },
    consultationFee: { type: Number, required: true, min: 0 },
    schedule: [scheduleSlotSchema],
    bio: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

export const Doctor = model<IDoctor>('Doctor', doctorSchema);
