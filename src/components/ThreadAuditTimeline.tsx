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
        return <Bot className="w-3.5 h-3.5 text-blue-600" />;
      case 'Operator':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'System':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'triage_performed':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Triage Performed</span>;
      case 'draft_generated':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Draft Generated</span>;
      case 'draft_approved':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Draft Approved</span>;
      case 'draft_edited':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">Draft Edited</span>;
      case 'draft_rejected':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">Draft Rejected</span>;
      case 'draft_snoozed':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">Draft Snoozed</span>;
      case 'reply_sent':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">Reply Sent</span>;
      case 'send_blocked':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-bold">Send Blocked (Invariant Guard)</span>;
      case 'thread_imported':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Thread Ingested</span>;
      case 'action_toggled':
        return <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">Action Item Updated</span>;
    }
  };

  const sortedLogs = [...auditLog].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Audit Ledger ({auditLog.length} Records)
        </h4>
        <span className="text-[11px] text-slate-400">Append-Only Cryptographic Log</span>
      </div>

      <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
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
              <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-600 transition-colors flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-blue-600" />
              </div>

              <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg p-3 transition-colors">
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
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {isExpanded ? 'Hide Draft Content' : 'View Snapshot of Draft'}
                    </button>
                    {isExpanded && (
                      <pre className="mt-1.5 p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700 font-mono whitespace-pre-wrap">
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
