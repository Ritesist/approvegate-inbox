import React from 'react';
import { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const styles: Record<Priority, string> = {
    P0: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300 font-bold',
    P1: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-300 font-semibold',
    P2: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-300 font-medium',
    P3: 'bg-slate-100 text-slate-700 border-slate-200 ring-1 ring-slate-200 font-normal',
  };

  const labels: Record<Priority, string> = {
    P0: 'P0 Critical',
    P1: 'P1 High',
    P2: 'P2 Medium',
    P3: 'P3 Low',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md',
    lg: 'text-sm px-3 py-1.5 rounded-md font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center border tracking-wide uppercase ${styles[priority]} ${sizeClasses[size]}`}
    >
      {labels[priority]}
    </span>
  );
};
