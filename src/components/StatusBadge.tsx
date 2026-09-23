import React from 'react';
import { ApprovalStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const styles: Record<ApprovalStatus, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    sent: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    snoozed: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  };

  const labels: Record<ApprovalStatus, string> = {
    pending: 'Pending Approval',
    approved: 'Approved (Ready)',
    sent: 'Sent to Customer',
    rejected: 'Draft Rejected',
    snoozed: 'Snoozed',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
    lg: 'text-xs px-3 py-1.5 rounded-full font-medium',
  };

  return (
    <span
      className={`inline-flex items-center border tracking-tight ${styles[status]} ${sizeClasses[size]}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {labels[status]}
    </span>
  );
};
