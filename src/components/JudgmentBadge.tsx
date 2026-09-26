import React from 'react';
import { ThreadJudgment } from '@/lib/types';

const ACTION_LABEL: Record<ThreadJudgment['actionType'], string> = {
  action: 'Routine action',
  escalation: 'Escalate',
  refund: 'Refund',
  investigation: 'Investigate',
  archive: 'Archive',
};

function tooltip(j: ThreadJudgment) {
  const src = j.source === 'typesafe' ? `TypeSafe ${j.model ?? 'Jev'}` : 'Rules engine (fallback)';
  const parts = [
    src,
    `Needs approval: ${j.probability.toFixed(2)}`,
    `Action: ${ACTION_LABEL[j.actionType]}`,
    `Urgency: ${j.urgency}`,
    `Confidence: ${j.confidence.toFixed(2)}`,
  ];
  if (j.fallbackReason) parts.push(`Fallback reason: ${j.fallbackReason}`);
  return parts.join('\n');
}

export const JudgmentBadge: React.FC<{ judgment?: ThreadJudgment; showReview?: boolean }> = ({
  judgment,
  showReview = true,
}) => {
  if (!judgment) return null;
  const isJev = judgment.source === 'typesafe';
  return (
    <span className="inline-flex items-center gap-1" title={tooltip(judgment)}>
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium font-mono ${
          isJev ? 'bg-sky-50 text-sky-700 border-sky-200/70' : 'bg-slate-50 text-slate-500 border-slate-200'
        }`}
      >
        {isJev ? `Jev ${judgment.probability.toFixed(2)}` : 'Rules'}
      </span>
      {showReview && judgment.needsReview && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md border font-medium bg-amber-50 text-amber-700 border-amber-200/70">
          Needs review
        </span>
      )}
    </span>
  );
};

export const JudgmentDetails: React.FC<{ judgment?: ThreadJudgment }> = ({ judgment }) => {
  if (!judgment) return null;
  const isJev = judgment.source === 'typesafe';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-500 pt-1">
      <JudgmentBadge judgment={judgment} />
      <span>
        Needs approval <span className="font-mono text-slate-700">{judgment.probability.toFixed(2)}</span>
      </span>
      <span>
        Action <span className="text-slate-700">{ACTION_LABEL[judgment.actionType]}</span>
      </span>
      <span>
        Urgency <span className="font-mono text-slate-700">{judgment.urgency}</span>
      </span>
      <span>
        Confidence <span className="font-mono text-slate-700">{judgment.confidence.toFixed(2)}</span>
      </span>
      {!isJev && judgment.fallbackReason && (
        <span className="text-slate-400">Fallback: {judgment.fallbackReason.replace(/_/g, ' ')}</span>
      )}
    </div>
  );
};
