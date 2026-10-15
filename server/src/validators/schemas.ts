import { z } from 'zod';
import { AppError } from '../utils/AppError';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF']).default('RECEPTIONIST'),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF']),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'BILLING_STAFF']).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  headDoctorId: z.string().optional(),
});

export const createDoctorSchema = z.object({
  userId: z.string().min(1),
  departmentId: z.string().min(1),
  specialization: z.string().min(2),
  qualification: z.string().min(2),
  experience: z.number().min(0),
  consultationFee: z.number().min(0),
  schedule: z
    .array(
      z.object({
        day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
      })
    )
    .optional()
    .default([]),
  bio: z.string().max(1000).optional(),
});

export const createPatientSchema = z.object({
  name: z.string().min(2).max(100),
  dob: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  allergies: z.array(z.string()).optional().default([]),
  emergencyContact: z.object({
    name: z.string().min(2),
    phone: z.string().min(7),
    relation: z.string().min(2),
  }),
});

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  departmentId: z.string().min(1),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'EMERGENCY']),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentSchema = z.object({
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  notes: z.string().max(1000).optional(),
  date: z.string().optional(),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const createConsultationSchema = z.object({
  appointmentId: z.string().min(1),
  chiefComplaint: z.string().min(5),
  diagnosis: z.string().min(5),
  prescription: z
    .array(
      z.object({
        medicine: z.string().min(1),
        dosage: z.string().min(1),
        duration: z.string().min(1),
        instructions: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  labTests: z.array(z.string()).optional().default([]),
  followUpDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  consultationFee: z.number().min(0),
  additionalCharges: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.number().min(0),
      })
    )
    .optional()
    .default([]),
  discount: z.number().min(0).default(0),
});

export const updateInvoiceSchema = z.object({
  paidAmount: z.number().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'INSURANCE', 'ONLINE']).optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'CANCELLED']).optional(),
  additionalCharges: z
    .array(
      z.object({
        description: z.string().min(1),
        amount: z.number().min(0),
      })
    )
    .optional(),
  discount: z.number().min(0).optional(),
});

export function validate<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new AppError(
        'Validation failed',
        400,
        result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      );
    }
    return result.data;
  };
}
