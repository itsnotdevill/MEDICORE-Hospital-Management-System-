import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  SCHEDULED: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
  NO_SHOW: { label: 'No Show', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  PARTIAL: { label: 'Partial', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  PAID: { label: 'Paid', className: 'bg-green-100 text-green-700 border-green-200' },
  CONSULTATION: { label: 'Consultation', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  FOLLOW_UP: { label: 'Follow-Up', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  EMERGENCY: { label: 'Emergency', className: 'bg-red-100 text-red-700 border-red-200' },
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 border-green-200' },
  INACTIVE: { label: 'Inactive', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
};
