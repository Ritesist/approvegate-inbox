'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TicketThread, Priority, Category, ApprovalStatus } from '@/lib/types';
import { ThreadCard } from './ThreadCard';
import { ApproveGatePanel } from './ApproveGatePanel';
import { ThreadAuditTimeline } from './ThreadAuditTimeline';
import { PriorityBadge } from './PriorityBadge';
import { CategoryBadge } from './CategoryBadge';
import { JudgmentDetails } from './JudgmentBadge';
import {
  Search,
  RefreshCw,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Lock,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  User,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const InboxWorkspace: React.FC = () => {
  const [threads, setThreads] = useState<TicketThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTriagingAll, setIsTriagingAll] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
      // Demo flag: /?judge=rules forces the rules fallback path.
      if (typeof window !== 'undefined') {
        const judge = new URLSearchParams(window.location.search).get('judge');
        if (judge) params.set('judge', judge);
      }

      const res = await fetch(`/api/threads?${params.toString()}`);
      const data = await res.json();
      const fetched: TicketThread[] = data.threads || [];
      setThreads(fetched);

      // Preserve selection if still in list, else pick first
      if (fetched.length > 0) {
        if (!selectedThreadId || !fetched.some((t) => t.id === selectedThreadId)) {
          setSelectedThreadId(fetched[0].id);
        }
      } else {
        setSelectedThreadId(null);
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

  const selectedThread = useMemo(() => {
    return threads.find((t) => t.id === selectedThreadId) || threads[0] || null;
  }, [threads, selectedThreadId]);

  const handleThreadUpdate = (updated: TicketThread) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...updated, judgment: updated.judgment ?? t.judgment } : t))
    );
  };

  const handleTriageAll = async () => {
    setIsTriagingAll(true);
    try {
      const res = await fetch('/api/triage-all', { method: 'POST' });
      await res.json();
      await fetchThreads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriagingAll(false);
    }
  };

  // Nav Counts & Status
  const totalCount = threads.length;
  const p0Count = threads.filter((t) => t.triage?.priority === 'P0').length;
  const pendingCount = threads.filter((t) => t.approvalStatus === 'pending').length;
  const approvedCount = threads.filter((t) => t.approvalStatus === 'approved').length;
  const sentCount = threads.filter((t) => t.approvalStatus === 'sent').length;
  const snoozedCount = threads.filter((t) => t.approvalStatus === 'snoozed').length;

  const activeFiltersCount =
    (priorityFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (tierFilter !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const resetAllFilters = () => {
    setPriorityFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setTierFilter('all');
    setSearchQuery('');
  };

  // Sender Initials for Detail view
  const senderInitials = selectedThread?.from.name
    ? selectedThread.from.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  // SLA Calculation
  let slaText = '';
  let slaIsOverdue = false;
  if (selectedThread?.triage?.dueBy) {
    const dueTime = new Date(selectedThread.triage.dueBy).getTime();
    const now = new Date('2026-09-23T08:55:00Z').getTime();
    const diffHours = Math.round((dueTime - now) / (3600 * 1000));
    if (diffHours <= 0) {
      slaText = 'SLA Overdue';
      slaIsOverdue = true;
    } else {
      slaText = `SLA: ${diffHours}h left`;
    }
  }

  // Prev / Next Thread Navigation
  const currentIndex = threads.findIndex((t) => t.id === selectedThread?.id);
  const handlePrevThread = () => {
    if (currentIndex > 0) setSelectedThreadId(threads[currentIndex - 1].id);
  };
  const handleNextThread = () => {
    if (currentIndex < threads.length - 1) setSelectedThreadId(threads[currentIndex + 1].id);
  };

  return (
    <div className="flex-1 flex overflow-hidden w-full bg-[#F7F8FA]">
      {/* =========================================================================
          ZONE 1: SLIM LEFT NAVIGATION (Pinterest-style sidebar)
          ========================================================================= */}
      <aside className="hidden md:flex w-52 lg:w-60 shrink-0 border-r border-slate-200/80 bg-[#FAFAFA] flex-col justify-between p-3.5 select-none">
        <div className="space-y-6">
          {/* Operator Profile Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-semibold text-xs flex items-center justify-center border border-purple-200/80 shrink-0">
              AG
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-slate-900 truncate">Operator Desk</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-slate-400 font-normal">Active Guard</span>
              </div>
            </div>
          </div>

          {/* Mailbox Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 block mb-1.5">
              Mailbox
            </span>

            {/* All Inbox */}
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'all' && priorityFilter === 'all'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-slate-400" />
                <span>Inbox</span>
              </div>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-600 font-normal">
                {totalCount}
              </span>
            </button>

            {/* Pending Gate */}
            <button
              onClick={() => {
                setStatusFilter('pending');
                setPriorityFilter('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Pending Gate</span>
              </div>
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-semibold">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* P0 Critical */}
            <button
              onClick={() => {
                setPriorityFilter('P0');
                setStatusFilter('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                priorityFilter === 'P0'
                  ? 'bg-rose-50 text-rose-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>P0 Critical</span>
              </div>
              {p0Count > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 font-semibold">
                  {p0Count}
                </span>
              )}
            </button>

            {/* Approved Ready */}
            <button
              onClick={() => {
                setStatusFilter('approved');
                setPriorityFilter('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Approved</span>
              </div>
              {approvedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  {approvedCount}
                </span>
              )}
            </button>

            {/* Sent / Dispatched */}
            <button
              onClick={() => {
                setStatusFilter('sent');
                setPriorityFilter('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'sent'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-slate-400" />
                <span>Dispatched</span>
              </div>
              {sentCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-600 font-normal">
                  {sentCount}
                </span>
              )}
            </button>

            {/* Snoozed */}
            <button
              onClick={() => {
                setStatusFilter('snoozed');
                setPriorityFilter('all');
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === 'snoozed'
                  ? 'bg-purple-50 text-purple-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Snoozed</span>
              </div>
              {snoozedCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-600 font-normal">
                  {snoozedCount}
                </span>
              )}
            </button>
          </div>

          {/* Categories Section (Reference 1 colored dot indicator style) */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2.5 block mb-1.5">
              Categories
            </span>

            {[
              { id: 'billing', label: 'Billing', color: 'bg-emerald-500' },
              { id: 'bug', label: 'Bugs', color: 'bg-rose-500' },
              { id: 'sales', label: 'Sales', color: 'bg-purple-500' },
              { id: 'FYI', label: 'FYI & Notices', color: 'bg-slate-400' },
              { id: 'other', label: 'Other Inquiries', color: 'bg-slate-500' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(categoryFilter === cat.id ? 'all' : cat.id);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-normal'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                  <span>{cat.label}</span>
                </div>
                {categoryFilter === cat.id && (
                  <span className="text-[10px] text-purple-600 font-bold">Selected</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-200/70 space-y-2">
          <div className="flex items-center gap-1.5 px-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span>Gate protected</span>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          ZONE 2: THREAD LIST COLUMN (Messages list with soft borders, purple left-bar)
          ========================================================================= */}
      <section className="w-full md:w-[320px] lg:w-[360px] xl:w-[400px] shrink-0 border-r border-slate-200/80 bg-white flex flex-col overflow-hidden">
        {/* Top Header & Compact Status Line */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Inbox</h1>
              {/* Compact single status line (replaces the 5 chunky colored pills!) */}
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                {threads.length} messages &bull; {pendingCount} pending &bull; {p0Count} critical
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleTriageAll}
                disabled={isTriagingAll}
                className="p-1.5 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-colors disabled:opacity-50"
                title="Triage all"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={fetchThreads}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200/80 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search bar & Filter trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Single Filters Trigger Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'border-purple-300 bg-purple-50 text-purple-700'
                  : 'border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
              title="Filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Restrained single-row Filter Tray (expandable via "Filters" control) */}
          {showFilters && (
            <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Filter Criteria</span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="text-purple-600 hover:text-purple-800 hover:underline text-[11px]"
                  >
                    Reset all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Priority Select */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">Priority: All</option>
                  <option value="P0">P0 Critical</option>
                  <option value="P1">P1 High</option>
                  <option value="P2">P2 Medium</option>
                  <option value="P3">P3 Low</option>
                </select>

                {/* Category Select */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">Category: All</option>
                  <option value="billing">Billing</option>
                  <option value="bug">Bug</option>
                  <option value="sales">Sales</option>
                  <option value="FYI">FYI</option>
                  <option value="other">Other</option>
                </select>

                {/* Gate Status Select */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">Gate Status: All</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="sent">Sent</option>
                  <option value="rejected">Rejected</option>
                  <option value="snoozed">Snoozed</option>
                </select>

                {/* Tier Select */}
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
                >
                  <option value="all">Tier: All</option>
                  <option value="vip">VIP</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="pro">Pro</option>
                  <option value="free">Free</option>
                </select>
              </div>
            </div>
          )}

          {/* Quick Category / Status Tabs (like ref-01 Primary / General / Socials tabs) */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-400 border-b border-slate-100 pt-1">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className={`pb-2 border-b-2 transition-colors ${
                statusFilter === 'all' && priorityFilter === 'all'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({threads.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter('pending');
                setPriorityFilter('all');
              }}
              className={`pb-2 border-b-2 transition-colors ${
                statusFilter === 'pending'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => {
                setPriorityFilter('P0');
                setStatusFilter('all');
              }}
              className={`pb-2 border-b-2 transition-colors ${
                priorityFilter === 'P0'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              P0 Urgent ({p0Count})
            </button>
            <button
              onClick={() => {
                setStatusFilter('approved');
                setPriorityFilter('all');
              }}
              className={`pb-2 border-b-2 transition-colors ${
                statusFilter === 'approved'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>
        </div>

        {/* Scrollable Thread List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400 font-normal">
              Loading threads...
            </div>
          ) : threads.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 space-y-2">
              <p>No threads match.</p>
              <button
                onClick={resetAllFilters}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium underline"
              >
                Clear filters
              </button>
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
      </section>

      {/* =========================================================================
          ZONE 3: DETAIL & APPROVEGATE READING PANE (Spacious layout from Pinterest refs)
          ========================================================================= */}
      <main className="flex-1 bg-white overflow-y-auto flex flex-col">
        {selectedThread ? (
          <>
            {/* Top Reading Action Bar */}
            <div className="h-12 border-b border-slate-100 px-6 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
              {/* Left: Prev / Next Thread Nav */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevThread}
                  disabled={currentIndex <= 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                  title="Previous ticket"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextThread}
                  disabled={currentIndex >= threads.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                  title="Next ticket"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-[11px] text-slate-400 ml-2 font-normal">
                  {currentIndex + 1} of {threads.length}
                </span>
              </div>

              {/* Right: Tier Badge & Invariant Status Pill */}
              <div className="flex items-center gap-2.5">
                {slaText && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      slaIsOverdue ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {slaText}
                  </span>
                )}

                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase font-mono font-medium border border-slate-200/60">
                  Tier: {selectedThread.customerTier}
                </span>

                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
                  <Lock className="w-3 h-3" />
                  Gate on
                </span>
              </div>
            </div>

            {/* Reading Pane Body with Generous Whitespace */}
            <div className="max-w-4xl w-full mx-auto px-6 py-6 lg:px-10 lg:py-8 space-y-6">
              {/* Subject Title */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                  {selectedThread.subject}
                </h2>
              </div>

              {/* Calm Sender Row */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/70 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                    {senderInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {selectedThread.from.name}
                      </span>
                      {selectedThread.from.company && (
                        <span className="text-xs text-slate-400 font-normal">
                          &bull; {selectedThread.from.company}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 font-normal">
                      to Operator &lt;{selectedThread.from.email}&gt;
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 font-normal">
                  <Calendar className="w-3 h-3 inline mr-1 opacity-70" />
                  {new Date(selectedThread.receivedAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Original Customer Message (Clean typography, breathing room) */}
              <div className="bg-[#FAFAFA] border border-slate-100 rounded-xl p-6">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                  Message
                </span>
                <div className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                  {selectedThread.rawBody}
                </div>
              </div>

              {/* Triage Card */}
              {selectedThread.triage && (
                <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Triage
                      </h3>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-mono">
                      {(selectedThread.triage.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-1">Priority</span>
                      <PriorityBadge priority={selectedThread.triage.priority} size="md" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-1">Category</span>
                      <CategoryBadge category={selectedThread.triage.category} size="md" />
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-1">Owner</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {selectedThread.triage.suggestedOwner}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block mb-1">SLA due</span>
                      <span className="font-mono text-slate-700 truncate block">
                        {new Date(selectedThread.triage.dueBy).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-600 mb-1">Summary</h5>
                    <p className="text-xs text-slate-700 bg-slate-50/60 p-3 rounded-lg border border-slate-100 leading-relaxed">
                      {selectedThread.triage.summary}
                    </p>
                  </div>

                  <JudgmentDetails judgment={selectedThread.judgment} />

                  {selectedThread.triage.reasoning && (
                    <div className="text-[11px] text-slate-400 italic">
                      Why: {selectedThread.triage.reasoning}
                    </div>
                  )}
                </div>
              )}

              {/* HERO COMPONENT: ApproveGate Panel (Purple primary / outline secondary) */}
              <ApproveGatePanel
                thread={selectedThread}
                onUpdate={handleThreadUpdate}
              />

              {/* Thread Audit Timeline */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
                <ThreadAuditTimeline auditLog={selectedThread.auditLog} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-2 p-8 text-center">
            <Layers className="w-9 h-9 text-slate-300" />
            <span className="font-medium text-slate-600">Select a thread</span>
            <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
              Pick a message to review triage and approve a draft.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
