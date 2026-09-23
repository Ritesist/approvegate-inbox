import React from 'react';
import { TicketThread } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import { Clock, User } from 'lucide-react';

interface ThreadCardProps {
  thread: TicketThread;
  isSelected: boolean;
  onSelect: () => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread, isSelected, onSelect }) => {
  const formattedTime = new Date(thread.receivedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate SLA label
  let slaLabel = '';
  if (thread.triage?.dueBy) {
    const dueTime = new Date(thread.triage.dueBy).getTime();
    const now = new Date('2026-09-23T08:55:00Z').getTime(); // align with system date
    const diffHours = Math.round((dueTime - now) / (3600 * 1000));
    if (diffHours <= 0) {
      slaLabel = 'SLA Overdue';
    } else {
      slaLabel = `SLA: ${diffHours}h left`;
    }
  }

  return (
    <div
      onClick={onSelect}
      className={`p-3.5 border-b cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50/60 border-l-4 border-l-blue-600 border-slate-200'
          : 'hover:bg-slate-50/80 border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {thread.triage ? (
            <>
              <PriorityBadge priority={thread.triage.priority} size="sm" />
              <CategoryBadge category={thread.triage.category} size="sm" />
            </>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
              Untriaged
            </span>
          )}
          <StatusBadge status={thread.approvalStatus} size="sm" />
        </div>
        <span className="text-[11px] text-slate-400 shrink-0">{formattedTime}</span>
      </div>

      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1 tracking-tight">
        {thread.subject}
      </h4>

      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
        {thread.triage?.summary || thread.rawBody}
      </p>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <User className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-700">{thread.from.name}</span>
          {thread.from.company && (
            <span className="text-slate-400 truncate">({thread.from.company})</span>
          )}
        </div>

        {slaLabel && (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              slaLabel.includes('Overdue') ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            <Clock className="w-3 h-3" />
            {slaLabel}
          </span>
        )}
      </div>
    </div>
  );
};
