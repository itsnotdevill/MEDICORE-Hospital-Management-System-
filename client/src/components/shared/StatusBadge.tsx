import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

interface BadgeStyle {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const statusConfig: Record<string, BadgeStyle> = {
  // Appointment / Consultation statuses
  SCHEDULED: {
    label: 'Scheduled',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
  },
  COMPLETED: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  NO_SHOW: {
    label: 'No Show',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  // Invoicing & Financial
  PENDING: {
    label: 'Pending',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
  PARTIAL: {
    label: 'Partial Payment',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
    dotClass: 'bg-orange-500',
  },
  PAID: {
    label: 'Paid',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dotClass: 'bg-teal-500',
  },
  // Appointment Types
  CONSULTATION: {
    label: 'Consultation',
    badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200/80',
    dotClass: 'bg-cyan-500',
  },
  FOLLOW_UP: {
    label: 'Follow-Up',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dotClass: 'bg-indigo-500',
  },
  EMERGENCY: {
    label: 'Emergency',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold',
    dotClass: 'bg-rose-600 animate-pulse',
  },
  // Account Statuses
  ACTIVE: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  INACTIVE: {
    label: 'Inactive',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  // Bed Statuses
  AVAILABLE: {
    label: 'Available',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dotClass: 'bg-emerald-500',
  },
  OCCUPIED: {
    label: 'Occupied',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dotClass: 'bg-rose-500',
  },
  CLEANING: {
    label: 'Cleaning',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
    dotClass: 'bg-blue-500',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dotClass: 'bg-amber-500',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  return (
    <span className={`status-badge ${config.badgeClass} ${className}`}>
      {showDot && <span className={`status-dot ${config.dotClass}`} />}
      {config.label}
    </span>
  );
};

