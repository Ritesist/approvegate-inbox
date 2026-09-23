'use client';

import React, { useState, useEffect } from 'react';
import { TicketThread, Priority, Category, ApprovalStatus } from '@/lib/types';
import { ThreadCard } from './ThreadCard';
import { ApproveGatePanel } from './ApproveGatePanel';
import { ThreadAuditTimeline } from './ThreadAuditTimeline';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import {
  Search,
  Filter,
  User,
  Building,
  Mail,
  Calendar,
  Sparkles,
  Layers,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const InboxWorkspace: React.FC = () => {
  const [threads, setThreads] = useState<TicketThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (priorityFilter !== 'all') params.set('priority', priorityFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (statusFilter !== 'all') params.set('approvalStatus', statusFilter);
      if (tierFilter !== 'all') params.set('tier', tierFilter);

      const res = await fetch(`/api/threads?${params.toString()}`);
      const data = await res.json();
      setThreads(data.threads || []);
      if (!selectedThreadId && data.threads?.length > 0) {
        setSelectedThreadId(data.threads[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [searchQuery, priorityFilter, categoryFilter, statusFilter, tierFilter]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || threads[0] || null;

  const handleThreadUpdate = (updated: TicketThread) => {
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  // KPI counts
  const p0Count = threads.filter((t) => t.triage?.priority === 'P0').length;
  const pendingCount = threads.filter((t) => t.approvalStatus === 'pending').length;
  const approvedCount = threads.filter((t) => t.approvalStatus === 'approved').length;
  const sentCount = threads.filter((t) => t.approvalStatus === 'sent').length;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Filter & Metrics Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              Total: {threads.length}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 font-semibold">
              P0 Critical: {p0Count}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              Pending Gate: {pendingCount}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              Approved (Ready): {approvedCount}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Dispatched: {sentCount}
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, sender, body, or triage summary..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchThreads}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Refresh inbox"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pills row */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 pt-2.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Priority: All</option>
            <option value="P0">P0 Critical</option>
            <option value="P1">P1 High</option>
            <option value="P2">P2 Medium</option>
            <option value="P3">P3 Low</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Category: All</option>
            <option value="billing">Billing</option>
            <option value="bug">Bug</option>
            <option value="sales">Sales</option>
            <option value="FYI">FYI</option>
            <option value="other">Other</option>
          </select>

          {/* Gate Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Gate Status: All</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved (Ready)</option>
            <option value="sent">Sent</option>
            <option value="rejected">Rejected</option>
            <option value="snoozed">Snoozed</option>
          </select>

          {/* Tier */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Tier: All</option>
            <option value="vip">VIP</option>
            <option value="enterprise">Enterprise</option>
            <option value="pro">Pro</option>
            <option value="free">Free</option>
          </select>

          {(priorityFilter !== 'all' ||
            categoryFilter !== 'all' ||
            statusFilter !== 'all' ||
            tierFilter !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setPriorityFilter('all');
                setCategoryFilter('all');
                setStatusFilter('all');
                setTierFilter('all');
                setSearchQuery('');
              }}
              className="text-[11px] text-blue-600 hover:text-blue-800 underline ml-2 shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Split Workspace View */}
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto">
        {/* Master Left Pane: Thread List */}
        <div className="w-full md:w-[420px] lg:w-[460px] border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Inbound Tickets ({threads.length})</span>
            <span className="text-[11px] text-slate-400 font-normal">Sorted by Severity</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading inbox...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tickets matching current filters.
              </div>
            ) : (
              threads.map((t) => (
                <ThreadCard
                  key={t.id}
                  thread={t}
                  isSelected={t.id === selectedThread?.id}
                  onSelect={() => setSelectedThreadId(t.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Detail Right Pane: Thread View + Triage + ApproveGate + Audit */}
        <div className="hidden md:flex flex-1 flex-col bg-slate-50/50 overflow-y-auto p-6 space-y-6">
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedThread.subject}
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 uppercase font-mono font-medium shrink-0">
                    Tier: {selectedThread.customerTier}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{selectedThread.from.name}</span>
                    {selectedThread.from.company && (
                      <span className="text-slate-400">({selectedThread.from.company})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-600">{selectedThread.from.email}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(selectedThread.receivedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Triage Intelligence Card */}
              {selectedThread.triage && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        AI Butler Triage Intelligence
                      </h3>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 font-mono">
                      Confidence: {(selectedThread.triage.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block mb-1">Priority</span>
                      <PriorityBadge priority={selectedThread.triage.priority} size="md" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block mb-1">Category</span>
                      <CategoryBadge category={selectedThread.triage.category} size="md" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block mb-1">Suggested Owner</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {selectedThread.triage.suggestedOwner}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[11px] text-slate-400 block mb-1">SLA Target Due</span>
                      <span className="font-mono text-slate-700 truncate block">
                        {new Date(selectedThread.triage.dueBy).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-500 mb-1">Summary</h5>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                      {selectedThread.triage.summary}
                    </p>
                  </div>

                  {selectedThread.triage.reasoning && (
                    <div className="text-[11px] text-slate-500 italic">
                      Classification Rationale: {selectedThread.triage.reasoning}
                    </div>
                  )}
                </div>
              )}

              {/* Original Customer Message */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Customer Email Body
                </h4>
                <div className="p-4 bg-slate-50 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-100 max-h-72 overflow-y-auto">
                  {selectedThread.rawBody}
                </div>
              </div>

              {/* HERO COMPONENT: ApproveGate Panel */}
              <ApproveGatePanel
                thread={selectedThread}
                onUpdate={handleThreadUpdate}
              />

              {/* Thread Audit Timeline */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <ThreadAuditTimeline auditLog={selectedThread.auditLog} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
              <Layers className="w-10 h-10 mb-2 opacity-50" />
              <span>Select a ticket from the left panel to inspect triage and approve draft.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
