import React from 'react';
import { Category } from '@/lib/types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'sm' }) => {
  const styles: Record<Category, string> = {
    billing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bug: 'bg-rose-50 text-rose-700 border-rose-200',
    sales: 'bg-purple-50 text-purple-700 border-purple-200',
    FYI: 'bg-slate-100 text-slate-600 border-slate-200',
    other: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full',
  };

  return (
    <span
      className={`inline-flex items-center border font-medium capitalize tracking-tight ${styles[category]} ${sizeClasses[size]}`}
    >
      {category}
    </span>
  );
};
