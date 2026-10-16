import type { UserRole } from '../types';

export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string | Date): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateAge(dob: string): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    ADMIN: 'bg-purple-50 text-purple-700 border border-purple-200',
    RECEPTIONIST: 'bg-blue-50 text-blue-700 border border-blue-200',
    DOCTOR: 'bg-teal-50 text-teal-700 border border-teal-200',
    BILLING_STAFF: 'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return colors[role] || 'bg-slate-50 text-slate-700 border border-slate-200';
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    RECEPTIONIST: 'Receptionist',
    DOCTOR: 'Doctor / Physician',
    BILLING_STAFF: 'Billing Officer',
  };
  return labels[role] || role;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-50 text-blue-700 border border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-200',
    NO_SHOW: 'bg-slate-100 text-slate-700 border border-slate-200',
    PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
    PARTIAL: 'bg-orange-50 text-orange-700 border border-orange-200',
    PAID: 'bg-teal-50 text-teal-700 border border-teal-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border border-slate-200',
  };
  return colors[status] || 'bg-slate-50 text-slate-700 border border-slate-200';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function extractError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosErr = error as { response?: { data?: { message?: string; errors?: string[] } } };
    const data = axiosErr.response?.data;
    if (data?.errors?.length) return data.errors.join(', ');
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
