'use client';

import React, { useState, useEffect } from 'react';
import { AuditLogEntry } from '@/lib/types';
import {
  History,
  ShieldCheck,
  Download,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Bot,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedSnapshot, setSelectedSnapshot] = useState<{ id: string; text: string } | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-log');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (actorFilter !== 'all' && log.actor !== actorFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchThread = log.threadId.toLowerCase().includes(q);
      const matchNote = (log.note || '').toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchThread && !matchNote && !matchAction) return false;
    }
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `approvegate-audit-log-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Compliance Audit Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident record of every AI triage event, draft state transition, and human approval signature.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search thread ID, action, or note..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Actor: All</option>
            <option value="AI Butler">AI Butler</option>
            <option value="Operator">Operator</option>
            <option value="System">System</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Action: All</option>
            <option value="draft_approved">draft_approved</option>
            <option value="reply_sent">reply_sent</option>
            <option value="send_blocked">send_blocked</option>
            <option value="draft_edited">draft_edited</option>
            <option value="draft_rejected">draft_rejected</option>
            <option value="draft_snoozed">draft_snoozed</option>
            <option value="triage_performed">triage_performed</option>
            <option value="draft_generated">draft_generated</option>
          </select>

          {(actorFilter !== 'all' || actionFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setActorFilter('all');
                setActionFilter('all');
                setSearch('');
              }}
              className="text-[11px] text-purple-600 hover:text-purple-800 underline ml-2 shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 uppercase">Draft Snapshot Record</h4>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap max-h-96 overflow-y-auto bg-slate-50">
              {selectedSnapshot.text}
            </pre>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Audit Events ({filteredLogs.length} matching)</span>
          <span className="text-[11px] text-slate-400 font-normal">Immutable sequence</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No audit events match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Thread ID</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Details & Note</th>
                  <th className="px-4 py-2.5 text-right">Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {dateStr} {timeStr}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                        {log.threadId}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded ${
                            log.actor === 'Operator'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : log.actor === 'AI Butler'
                              ? 'bg-purple-50 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {log.actor}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            log.action === 'draft_approved'
                              ? 'bg-purple-100 text-purple-800'
                              : log.action === 'reply_sent'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.action === 'send_blocked'
                              ? 'bg-red-100 text-red-800 ring-1 ring-red-400'
                              : log.action === 'draft_rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-md">
                        <span className="line-clamp-2">{log.note || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {log.draftSnapshot ? (
                          <button
                            onClick={() =>
                              setSelectedSnapshot({ id: log.id, text: log.draftSnapshot! })
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 font-medium"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
