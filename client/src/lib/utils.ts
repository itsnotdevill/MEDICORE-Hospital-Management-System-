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
    ADMIN: 'bg-purple-100 text-purple-700',
    RECEPTIONIST: 'bg-blue-100 text-blue-700',
    DOCTOR: 'bg-teal-100 text-teal-700',
    BILLING_STAFF: 'bg-amber-100 text-amber-700',
  };
  return colors[role] || 'bg-gray-100 text-gray-700';
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ADMIN: 'Admin',
    RECEPTIONIST: 'Receptionist',
    DOCTOR: 'Doctor',
    BILLING_STAFF: 'Billing Staff',
  };
  return labels[role] || role;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-amber-100 text-amber-700',
    PARTIAL: 'bg-orange-100 text-orange-700',
    PAID: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
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
