'use client';

import React, { useState, useEffect } from 'react';
import { TicketThread, SuggestedAction } from '@/lib/types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Edit3,
  Sparkles,
  AlertTriangle,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { SnoozeModal } from './SnoozeModal';
import { RejectModal } from './RejectModal';

interface ApproveGatePanelProps {
  thread: TicketThread;
  onUpdate: (updatedThread: TicketThread) => void;
}

export const ApproveGatePanel: React.FC<ApproveGatePanelProps> = ({ thread, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftBody, setDraftBody] = useState(thread.draft?.body || '');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSnoozeModal, setShowSnoozeModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invariantWarning, setInvariantWarning] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    setDraftBody(thread.draft?.body || '');
    setIsEditing(false);
    setInvariantWarning(null);
    setSuccessBanner(null);
  }, [thread.id, thread.draft?.body]);

  const handleRunTriage = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/threads/${thread.id}/triage`, { method: 'POST' });
      const data = await res.json();
      if (data.thread) {
        onUpdate(data.thread);
        setSuccessBanner('AI Butler triage analysis and reply draft generated.');
      }
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    setInvariantWarning(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onUpdate(data.thread);
      setSuccessBanner('Draft approved by operator. Human gate unlocked for authorized dispatch.');
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    setInvariantWarning(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          body: draftBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onUpdate(data.thread);
      setIsEditing(false);
      setSuccessBanner('Draft changes saved. Note: Editing resets approval to pending for zero auto-send safety.');
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsProcessing(true);
    setInvariantWarning(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onUpdate(data.thread);
      setSuccessBanner('Draft rejected and recorded in audit ledger.');
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSnooze = async (hours: number, reason: string) => {
    setIsProcessing(true);
    setInvariantWarning(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'snooze', hours, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      onUpdate(data.thread);
      setSuccessBanner(`Thread snoozed for ${hours} hours.`);
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAction = async (actionId: string) => {
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_action', actionId }),
      });
      const data = await res.json();
      if (data.thread) onUpdate(data.thread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthorizedSend = async () => {
    setIsProcessing(true);
    setInvariantWarning(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error);
      }
      onUpdate(data.thread);
      setSuccessBanner(`Message sent successfully to ${thread.from.email}. Zero auto-send gate satisfied.`);
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestInvariantViolation = async () => {
    setIsProcessing(true);
    setInvariantWarning(null);
    try {
      const res = await fetch(`/api/threads/${thread.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInvariantWarning(`HARD GATE TRIGGERED: ${data.message}`);
      } else {
        onUpdate(data.thread);
      }
    } catch (err: any) {
      setInvariantWarning(`Network or system error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!thread.triage || !thread.draft) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
        <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800">Thread Awaiting Triage</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Click below to run AI Butler triage to analyze priority, category, summary, SLA due date, and ready-to-send draft.
        </p>
        <button
          onClick={handleRunTriage}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Analyzing Thread...' : 'Run AI Triage & Draft'}
        </button>
      </div>
    );
  }

  const isApproved = thread.approvalStatus === 'approved';
  const isSent = thread.approvalStatus === 'sent';
  const isRejected = thread.approvalStatus === 'rejected';
  const isSnoozed = thread.approvalStatus === 'snoozed';

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* ApproveGate Header Banner */}
      <div
        className={`px-5 py-3 border-b flex items-center justify-between transition-colors ${
          isApproved
            ? 'bg-blue-50/80 border-blue-200'
            : isSent
            ? 'bg-emerald-50/80 border-emerald-200'
            : isRejected
            ? 'bg-rose-50/80 border-rose-200'
            : isSnoozed
            ? 'bg-purple-50/80 border-purple-200'
            : 'bg-amber-50/80 border-amber-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isApproved ? (
            <Unlock className="w-4 h-4 text-blue-700" />
          ) : isSent ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          ) : isRejected ? (
            <XCircle className="w-4 h-4 text-rose-700" />
          ) : isSnoozed ? (
            <Clock className="w-4 h-4 text-purple-700" />
          ) : (
            <Lock className="w-4 h-4 text-amber-700" />
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Hard Human-Approve Gate
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  isApproved
                    ? 'bg-blue-200/80 text-blue-900'
                    : isSent
                    ? 'bg-emerald-200/80 text-emerald-900'
                    : isRejected
                    ? 'bg-rose-200/80 text-rose-900'
                    : isSnoozed
                    ? 'bg-purple-200/80 text-purple-900'
                    : 'bg-amber-200/80 text-amber-900'
                }`}
              >
                {thread.approvalStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {isApproved
                ? 'Operator verified and approved. Outbound send unlocked.'
                : isSent
                ? 'Authorized dispatch completed. Recorded in audit ledger.'
                : isRejected
                ? 'Draft response rejected by human operator. Zero email sent.'
                : isSnoozed
                ? `Snoozed until ${new Date(thread.snoozedUntil || '').toLocaleTimeString()}`
                : 'Zero auto-send rule active. Nothing sends to customer without human operator sign-off.'}
            </p>
          </div>
        </div>

        {/* Live Invariant status pill */}
        <div className="text-right">
          <span className="text-[11px] font-mono font-medium px-2 py-1 rounded bg-white/80 border border-slate-300 text-slate-700">
            Invariant: NeverSentWithoutApprove
          </span>
        </div>
      </div>

      {/* Notifications & Warning Banners */}
      {invariantWarning && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
          <div>
            <span className="font-semibold block">Hard Approval Gate Protection:</span>
            <span>{invariantWarning}</span>
          </div>
        </div>
      )}

      {successBanner && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Content Body */}
      <div className="p-5 space-y-4">
        {/* Draft Reply Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">
              Ready-to-Send Reply Draft
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              (Tone: <span className="font-medium text-slate-700 capitalize">{thread.draft.tone}</span>, v{thread.draft.version})
            </span>
          </div>

          {!isSent && !isRejected && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isProcessing}
                    className="text-xs font-medium px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 transition-colors font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Reply
                </button>
              )}
            </div>
          )}
        </div>

        {/* Draft Textarea or Display */}
        <div className="relative">
          {isEditing ? (
            <textarea
              rows={7}
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              className="w-full text-xs font-mono p-3 border-2 border-blue-400 rounded-lg focus:outline-none ring-2 ring-blue-100 bg-white"
            />
          ) : (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
              {thread.draft.body}
            </div>
          )}
        </div>

        {/* Suggested Next Actions Checklist */}
        {thread.draft.suggestedActions.length > 0 && (
          <div className="pt-2">
            <h5 className="text-xs font-semibold text-slate-700 mb-2">
              Suggested Next Actions ({thread.draft.suggestedActions.filter((a) => a.completed).length}/{thread.draft.suggestedActions.length} completed)
            </h5>
            <div className="space-y-1.5">
              {thread.draft.suggestedActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleToggleAction(action.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    action.completed
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {action.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span>{action.title}</span>
                  </div>

                  {action.systemTarget && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Target: {action.systemTarget}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls & Gate Enforcers */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Action Buttons: Approve, Reject, Snooze */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isSent && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || isApproved}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${
                    isApproved
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isApproved ? 'Approved by Operator' : 'Approve Draft'}
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing || isRejected}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>

                <button
                  onClick={() => setShowSnoozeModal(true)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Snooze
                </button>
              </>
            )}
          </div>

          {/* Right Action: Send Reply (Hard Gate Enforced) */}
          <div className="flex items-center gap-2">
            {!isApproved && !isSent && (
              <button
                onClick={handleTestInvariantViolation}
                className="text-[11px] px-2.5 py-1.5 rounded text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-medium transition-colors"
                title="Test sending without approval to verify the server hard-blocks the action"
              >
                Test Send Invariant Protection
              </button>
            )}

            {!isSent && (
              <button
                onClick={handleAuthorizedSend}
                disabled={!isApproved || isProcessing}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-sm transition-all ${
                  isApproved
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ring-2 ring-emerald-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                }`}
                title={
                  isApproved
                    ? 'Operator approval verified. Click to dispatch reply.'
                    : 'Hard Gate: Button disabled. You must click Approve Draft above before sending.'
                }
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Approved Reply</span>
              </button>
            )}

            {isSent && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Reply Dispatched to Customer
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onReject={handleReject}
        />
      )}

      {showSnoozeModal && (
        <SnoozeModal
          onClose={() => setShowSnoozeModal(false)}
          onSnooze={handleSnooze}
        />
      )}
    </div>
  );
};
