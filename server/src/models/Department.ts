import { Schema, model, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  headDoctorId?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500 },
    headDoctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Department = model<IDepartment>('Department', departmentSchema);
