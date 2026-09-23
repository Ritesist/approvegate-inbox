import React from 'react';
import { Category } from '@/lib/types';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'sm' }) => {
  const styles: Record<Category, string> = {
    billing: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    bug: 'bg-rose-50 text-rose-800 border-rose-200',
    sales: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    FYI: 'bg-slate-100 text-slate-700 border-slate-200',
    other: 'bg-violet-50 text-violet-800 border-violet-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded',
    md: 'text-xs px-2.5 py-1 rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center border font-medium capitalize ${styles[category]} ${sizeClasses[size]}`}
    >
      {category}
    </span>
  );
};
