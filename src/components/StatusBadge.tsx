import React from 'react';
import { ApprovalStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const styles: Record<ApprovalStatus, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300 font-medium',
    approved: 'bg-blue-50 text-blue-800 border-blue-200 ring-1 ring-blue-300 font-semibold',
    sent: 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-300 font-semibold',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200 ring-1 ring-rose-300 font-medium',
    snoozed: 'bg-purple-50 text-purple-800 border-purple-200 ring-1 ring-purple-300 font-medium',
  };

  const labels: Record<ApprovalStatus, string> = {
    pending: 'Pending Approval',
    approved: 'Approved (Ready to Send)',
    sent: 'Sent to Customer',
    rejected: 'Draft Rejected',
    snoozed: 'Snoozed',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md',
    lg: 'text-sm px-3 py-1.5 rounded-md font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center border ${styles[status]} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {labels[status]}
    </span>
  );
};
