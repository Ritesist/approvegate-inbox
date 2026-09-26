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
        setSuccessBanner('Triage complete. Draft ready.');
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
      setSuccessBanner('Approved. Send unlocked.');
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
      setSuccessBanner('Saved. Approval reset to pending.');
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
      setSuccessBanner('Rejected. Logged in audit.');
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
      setSuccessBanner(`Snoozed for ${hours} hours.`);
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
      setSuccessBanner(`Sent to ${thread.from.email}.`);
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
        setInvariantWarning(data.message);
      } else {
        onUpdate(data.thread);
      }
    } catch (err: any) {
      setInvariantWarning(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!thread.triage || !thread.draft) {
    return (
      <div className="p-8 bg-slate-50/60 border border-slate-200/80 rounded-xl text-center space-y-3">
        <Sparkles className="w-7 h-7 text-purple-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-800">Needs triage</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Run triage to classify this thread and draft a reply.
        </p>
        <button
          onClick={handleRunTriage}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {isProcessing ? 'Running triage...' : 'Run triage'}
        </button>
      </div>
    );
  }

  const isApproved = thread.approvalStatus === 'approved';
  const isSent = thread.approvalStatus === 'sent';
  const isRejected = thread.approvalStatus === 'rejected';
  const isSnoozed = thread.approvalStatus === 'snoozed';

  return (
    <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-xs">
      {/* ApproveGate Header Banner */}
      <div
        className={`px-5 py-3 border-b flex items-center justify-between transition-colors ${
          isApproved
            ? 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
            : isSent
            ? 'bg-slate-50 border-slate-100 text-slate-800'
            : isRejected
            ? 'bg-rose-50/70 border-rose-100 text-rose-900'
            : isSnoozed
            ? 'bg-purple-50/70 border-purple-100 text-purple-900'
            : 'bg-amber-50/70 border-amber-100 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {isApproved ? (
            <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : isSent ? (
            <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
          ) : isRejected ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : isSnoozed ? (
            <Clock className="w-4 h-4 text-purple-600 shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                ApproveGate
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${
                  isApproved
                    ? 'bg-emerald-100 text-emerald-800'
                    : isSent
                    ? 'bg-slate-200/80 text-slate-700'
                    : isRejected
                    ? 'bg-rose-100 text-rose-800'
                    : isSnoozed
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {thread.approvalStatus}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isApproved
                ? 'Approved. Ready to send.'
                : isSent
                ? 'Sent. Logged in the audit trail.'
                : isRejected
                ? 'Rejected. Nothing was sent.'
                : isSnoozed
                ? `Snoozed until ${new Date(thread.snoozedUntil || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Nothing sends until an operator approves.'}
            </p>
          </div>
        </div>

        {/* Live Invariant status pill */}
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/80 text-slate-500">
            Never send without approve
          </span>
        </div>
      </div>

      {/* Notifications & Warning Banners */}
      {invariantWarning && (
        <div className="p-3 bg-rose-50 border-b border-rose-100 text-xs text-rose-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          <div>
            <span className="font-semibold block">Gate blocked:</span>
            <span>{invariantWarning}</span>
          </div>
        </div>
      )}

      {successBanner && (
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Content Body */}
      <div className="p-5 space-y-4">
        {/* Draft Reply Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900">
              Draft reply
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              (Tone: <span className="text-slate-600 capitalize">{thread.draft.tone}</span>, v{thread.draft.version})
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
                    className="text-xs font-medium px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
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
              className="w-full text-xs font-sans p-3 border border-purple-300 rounded-lg focus:outline-none ring-2 ring-purple-100 bg-white leading-relaxed"
            />
          ) : (
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 text-xs sm:text-[13px] font-sans text-slate-700 whitespace-pre-wrap leading-relaxed">
              {thread.draft.body}
            </div>
          )}
        </div>

        {/* Next actions Checklist */}
        {thread.draft.suggestedActions.length > 0 && (
          <div className="pt-2">
            <h5 className="text-xs font-semibold text-slate-800 mb-2">
              Next actions ({thread.draft.suggestedActions.filter((a) => a.completed).length}/{thread.draft.suggestedActions.length} done)
            </h5>
            <div className="space-y-1.5">
              {thread.draft.suggestedActions.map((action) => (
                <div
                  key={action.id}
                  onClick={() => handleToggleAction(action.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    action.completed
                      ? 'bg-slate-50/50 border-slate-100 text-slate-400 line-through'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {action.completed ? (
                      <CheckSquare className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>{action.title}</span>
                  </div>

                  {action.systemTarget && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono">
                      {action.systemTarget}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls & Gate Enforcers */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          {/* Left Action Buttons: Approve (Purple primary), Reject, Snooze (outline secondary) */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isSent && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing || isApproved}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all shadow-xs ${
                    isApproved
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isApproved ? 'Approved' : 'Approve'}
                </button>

                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing || isRejected}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:text-rose-700 hover:border-rose-200 hover:bg-rose-50/50 transition-colors"
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
                className="text-[11px] px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 font-normal transition-colors"
                title="Try send without approval to confirm the gate blocks it"
              >
                Test gate block
              </button>
            )}

            {!isSent && (
              <button
                onClick={handleAuthorizedSend}
                disabled={!isApproved || isProcessing}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-all shadow-xs ${
                  isApproved
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer ring-2 ring-emerald-100'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
                title={
                  isApproved
                    ? 'Approval verified. Click to send.'
                    : 'Approve the draft before sending.'
                }
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send reply</span>
              </button>
            )}

            {isSent && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Sent
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
