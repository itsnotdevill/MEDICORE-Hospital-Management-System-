import api from './axios';
import type { User, PaginatedResponse, ApiResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<User>>('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; role?: string; phone?: string }) =>
    api.post<ApiResponse<User>>('/auth/register', data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  getMe: () => api.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put<ApiResponse<User>>('/auth/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.put<ApiResponse<null>>('/auth/change-password', { currentPassword, newPassword }),

  getHealth: () => api.get('/health'),
  getSystemStatus: () => api.get('/system/status'),
};

export const systemApi = {
  getStatus: () => api.get('/system/status'),
  getHealth: () => api.get('/health'),
};

export const usersApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getById: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    phone?: string;
  }) => api.post<ApiResponse<User>>('/users', data),

  update: (id: string, data: Partial<User & { isActive: boolean }>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  deactivate: (id: string) => api.delete<ApiResponse<null>>(`/users/${id}`),
};

export const departmentsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api.get('/departments', { params }),

  create: (data: { name: string; description?: string; headDoctorId?: string }) =>
    api.post('/departments', data),

  update: (id: string, data: { name?: string; description?: string; headDoctorId?: string }) =>
    api.put(`/departments/${id}`, data),

  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const doctorsApi = {
  getAll: (params?: { page?: number; limit?: number; departmentId?: string }) =>
    api.get('/doctors', { params }),

  getById: (id: string) => api.get(`/doctors/${id}`),

  create: (data: unknown) => api.post('/doctors', data),

  update: (id: string, data: unknown) => api.put(`/doctors/${id}`, data),
};

export const patientsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/patients', { params }),

  getById: (id: string) => api.get(`/patients/${id}`),

  create: (data: unknown) => api.post('/patients', data),

  update: (id: string, data: unknown) => api.put(`/patients/${id}`, data),
};

export const appointmentsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    doctorId?: string;
    patientId?: string;
    date?: string;
  }) => api.get('/appointments', { params }),

  getById: (id: string) => api.get(`/appointments/${id}`),

  create: (data: unknown) => api.post('/appointments', data),

  update: (id: string, data: unknown) => api.put(`/appointments/${id}`, data),

  cancel: (id: string) => api.delete(`/appointments/${id}`),
};

export const consultationsApi = {
  getByAppointment: (appointmentId: string) =>
    api.get(`/consultations/appointment/${appointmentId}`),

  create: (data: unknown) => api.post('/consultations', data),

  update: (id: string, data: unknown) => api.put(`/consultations/${id}`, data),
};

export const invoicesApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string; patientId?: string }) =>
    api.get('/invoices', { params }),

  getById: (id: string) => api.get(`/invoices/${id}`),

  create: (data: unknown) => api.post('/invoices', data),

  update: (id: string, data: unknown) => api.put(`/invoices/${id}`, data),
};

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),

  getAuditLogs: (params?: { page?: number; limit?: number }) =>
    api.get('/reports/audit-logs', { params }),
};

export const servicesApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; search?: string }) =>
    api.get('/services', { params }),

  create: (data: unknown) => api.post('/services', data),
};

export const pharmacyApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; search?: string; lowStock?: boolean }) =>
    api.get('/pharmacy', { params }),

  updateStock: (id: string, data: { stockQuantity?: number; unitPrice?: number }) =>
    api.put(`/pharmacy/${id}/stock`, data),
};

export const bedsApi = {
  getAll: (params?: { wardType?: string; status?: string }) =>
    api.get('/beds', { params }),

  updateStatus: (id: string, data: unknown) =>
    api.put(`/beds/${id}/status`, data),
};

