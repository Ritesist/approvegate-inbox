import React from 'react';
import { Priority } from '@/lib/types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const styles: Record<Priority, string> = {
    P0: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
    P1: 'bg-amber-50 text-amber-800 border-amber-200 font-medium',
    P2: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
    P3: 'bg-slate-50 text-slate-500 border-slate-200 font-normal',
  };

  const labels: Record<Priority, string> = {
    P0: 'P0 Critical',
    P1: 'P1 High',
    P2: 'P2 Medium',
    P3: 'P3 Low',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full font-medium',
    md: 'text-xs px-2.5 py-1 rounded-full font-medium',
    lg: 'text-xs px-3 py-1.5 rounded-full font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center border tracking-tight ${styles[priority]} ${sizeClasses[size]}`}
    >
      {labels[priority]}
    </span>
  );
};
