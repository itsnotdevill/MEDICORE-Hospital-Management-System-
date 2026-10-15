import { Schema, model, Document, Types } from 'mongoose';

export type ServiceCategory = 'LABORATORY' | 'RADIOLOGY' | 'PROCEDURE' | 'CONSULTATION' | 'ROOM_CHARGE';

export interface IHospitalService extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  category: ServiceCategory;
  description?: string;
  departmentId?: Types.ObjectId;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hospitalServiceSchema = new Schema<IHospitalService>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['LABORATORY', 'RADIOLOGY', 'PROCEDURE', 'CONSULTATION', 'ROOM_CHARGE'],
      required: true,
    },
    description: { type: String, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hospitalServiceSchema.index({ name: 'text', code: 'text', category: 1 });

export const HospitalService = model<IHospitalService>('HospitalService', hospitalServiceSchema);
