import { Schema, model, Document, Types } from 'mongoose';

export type MedicineCategory = 'TABLET' | 'CAPSULE' | 'INJECTION' | 'SYRUP' | 'OINTMENT' | 'DROPS' | 'INHALER';

export interface IPharmacyItem extends Document {
  _id: Types.ObjectId;
  code: string;
  name: string;
  genericName: string;
  category: MedicineCategory;
  dosageStrength: string;
  manufacturer: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  batchNumber: string;
  expiryDate: Date;
  requiresPrescription: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const pharmacyItemSchema = new Schema<IPharmacyItem>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['TABLET', 'CAPSULE', 'INJECTION', 'SYRUP', 'OINTMENT', 'DROPS', 'INHALER'],
      required: true,
    },
    dosageStrength: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    unitPrice: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 20 },
    batchNumber: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    requiresPrescription: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

pharmacyItemSchema.index({ name: 'text', genericName: 'text', code: 'text' });

export const PharmacyItem = model<IPharmacyItem>('PharmacyItem', pharmacyItemSchema);
