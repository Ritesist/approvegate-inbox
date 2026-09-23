import React, { useState } from 'react';
import { AuditLogEntry } from '@/lib/types';
import { ShieldCheck, UserCheck, Bot, AlertTriangle, Send, FileEdit, Clock, CheckCircle2 } from 'lucide-react';

interface ThreadAuditTimelineProps {
  auditLog: AuditLogEntry[];
}

export const ThreadAuditTimeline: React.FC<ThreadAuditTimelineProps> = ({ auditLog }) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const getActorIcon = (actor: AuditLogEntry['actor']) => {
    switch (actor) {
      case 'AI Butler':
        return <Bot className="w-3.5 h-3.5 text-purple-600" />;
      case 'Operator':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'System':
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'triage_performed':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70">Triage Performed</span>;
      case 'draft_generated':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/70">Draft Generated</span>;
      case 'draft_approved':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Draft Approved</span>;
      case 'draft_edited':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">Draft Edited</span>;
      case 'draft_rejected':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Draft Rejected</span>;
      case 'draft_snoozed':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Draft Snoozed</span>;
      case 'reply_sent':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">Reply Sent</span>;
      case 'send_blocked':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">Send Blocked (Gate Guard)</span>;
      case 'thread_imported':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Thread Ingested</span>;
      case 'action_toggled':
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">Action Item Updated</span>;
    }
  };

  const sortedLogs = [...auditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          Audit Ledger ({auditLog.length} Records)
        </h4>
        <span className="text-[11px] text-slate-400 font-normal">Tamper-evident trail</span>
      </div>

      <div className="relative pl-4 border-l border-slate-200 space-y-3 pt-1">
        {sortedLogs.map((log) => {
          const time = new Date(log.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          const date = new Date(log.timestamp).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          });

          const isExpanded = expandedLogId === log.id;

          return (
            <div key={log.id} className="relative group">
              {/* Timeline marker */}
              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-slate-300 group-hover:border-purple-600 transition-colors flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-purple-600" />
              </div>

              <div className="bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-lg p-3 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                      {getActorIcon(log.actor)}
                      {log.actor}
                    </span>
                    {getActionBadge(log.action)}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {date} {time}
                  </span>
                </div>

                {log.note && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {log.note}
                  </p>
                )}

                {log.draftSnapshot && (
                  <div className="mt-2">
                    <button
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      className="text-[11px] font-medium text-purple-600 hover:text-purple-800 hover:underline"
                    >
                      {isExpanded ? 'Hide Draft Content' : 'View Snapshot of Draft'}
                    </button>
                    {isExpanded && (
                      <pre className="mt-1.5 p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                        {log.draftSnapshot}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
