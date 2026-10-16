export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'BILLING_STAFF';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  googleId?: string;
  googleEmail?: string;
  googleAvatar?: string;
  authProvider?: 'LOCAL' | 'GOOGLE' | 'BOTH';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  _id: string;
  name: string;
  description?: string;
  headDoctorId?: User | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSlot {
  day: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  startTime: string;
  endTime: string;
}

export interface Doctor {
  _id: string;
  userId: User;
  departmentId: Department;
  specialization: string;
  qualification: string;
  experience: number;
  consultationFee: number;
  schedule: ScheduleSlot[];
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface Patient {
  _id: string;
  patientId: string;
  name: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  bloodGroup?: string;
  allergies: string[];
  emergencyContact: EmergencyContact;
  registeredBy: User | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type AppointmentType = 'CONSULTATION' | 'FOLLOW_UP' | 'EMERGENCY';

export interface Appointment {
  _id: string;
  appointmentId: string;
  patientId: Patient | string;
  doctorId: User | string;
  departmentId: Department | string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  duration: string;
  instructions?: string;
}

export interface Consultation {
  _id: string;
  appointmentId: Appointment | string;
  patientId: Patient | string;
  doctorId: User | string;
  chiefComplaint: string;
  diagnosis: string;
  prescription: PrescriptionItem[];
  labTests: string[];
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'INSURANCE' | 'ONLINE';

export interface AdditionalCharge {
  description: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  invoiceId: string;
  patientId: Patient | string;
  appointmentId: Appointment | string;
  consultationFee: number;
  additionalCharges: AdditionalCharge[];
  discount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  userId: User | string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  pendingInvoices: number;
  totalDoctors: number;
  appointmentsByStatus: { _id: string; count: number }[];
  revenueByMonth: { _id: { year: number; month: number }; revenue: number }[];
}

export interface HospitalService {
  _id: string;
  code: string;
  name: string;
  category: 'LABORATORY' | 'RADIOLOGY' | 'PROCEDURE' | 'CONSULTATION' | 'ROOM_CHARGE';
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: string;
}

export interface PharmacyItem {
  _id: string;
  code: string;
  name: string;
  genericName: string;
  category: 'TABLET' | 'CAPSULE' | 'INJECTION' | 'SYRUP' | 'OINTMENT' | 'DROPS' | 'INHALER';
  dosageStrength: string;
  manufacturer: string;
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  batchNumber: string;
  expiryDate: string;
  requiresPrescription: boolean;
}

export interface WardBed {
  _id: string;
  bedNumber: string;
  wardType: 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE_AC' | 'ICU' | 'EMERGENCY' | 'RECOVERY';
  floor: number;
  roomNumber: string;
  dailyRate: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';
  currentPatientId?: Patient | { _id: string; name: string; patientId: string; phone?: string };
  assignedDoctorId?: User | { _id: string; name: string };
  admittedAt?: string;
  notes?: string;
}

