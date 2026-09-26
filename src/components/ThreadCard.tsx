import React from 'react';
import { TicketThread } from '@/lib/types';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import { JudgmentBadge } from './JudgmentBadge';

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

  const initials = thread.from.name
    ? thread.from.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const isPending = thread.approvalStatus === 'pending';

  return (
    <div
      onClick={onSelect}
      className={`relative px-4 py-3.5 border-b cursor-pointer transition-all ${
        isSelected
          ? 'bg-[#F9FAFB] border-l-[3px] border-l-purple-600 border-b-slate-100'
          : 'bg-white hover:bg-slate-50/70 border-b-slate-100 border-l-[3px] border-l-transparent'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-semibold shrink-0">
            {initials}
          </div>
          <span className="text-xs font-medium text-slate-800 truncate">
            {thread.from.name}
          </span>
          {isPending && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"
              title="Pending Gate Review"
            />
          )}
        </div>
        <span className="text-[11px] text-slate-400 shrink-0 font-normal">
          {formattedTime}
        </span>
      </div>

      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1 tracking-tight">
        {thread.subject}
      </h4>

      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-2.5">
        {thread.triage?.summary || thread.rawBody}
      </p>

      {/* Reduced Badge Noise: 1 priority + 1 category max */}
      <div className="flex items-center gap-1.5">
        {thread.triage ? (
          <>
            <PriorityBadge priority={thread.triage.priority} size="sm" />
            <CategoryBadge category={thread.triage.category} size="sm" />
            <span className="ml-auto">
              <JudgmentBadge judgment={thread.judgment} />
            </span>
          </>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
            Untriaged
          </span>
        )}
      </div>
    </div>
  );
};
