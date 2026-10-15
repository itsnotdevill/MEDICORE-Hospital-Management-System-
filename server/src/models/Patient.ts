import { Schema, model, Document, Types } from 'mongoose';

export interface IEmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface IPatient extends Document {
  _id: Types.ObjectId;
  patientId: string;
  name: string;
  dob: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  emergencyContact: IEmergencyContact;
  registeredBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientId: { type: String, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    dob: { type: Date, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    allergies: [{ type: String, trim: true }],
    emergencyContact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relation: { type: String, required: true, trim: true },
    },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate patientId before saving
patientSchema.pre('save', async function (next) {
  if (!this.patientId) {
    const count = await model('Patient').countDocuments();
    let candidate = `P-${String(count + 1).padStart(5, '0')}`;
    const exists = await model('Patient').findOne({ patientId: candidate });
    if (exists) {
      candidate = `P-${String(count + 1).padStart(5, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    }
    this.patientId = candidate;
  }
  next();
});

// Text index for search
patientSchema.index({ name: 'text', phone: 'text', patientId: 'text' });

export const Patient = model<IPatient>('Patient', patientSchema);
