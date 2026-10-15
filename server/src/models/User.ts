import { Schema, model, Document, Types } from 'mongoose';

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'BILLING_STAFF';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF'],
      required: true,
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Never return passwordHash in JSON
userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.passwordHash;
    return ret;
  },
});

export const User = model<IUser>('User', userSchema);
