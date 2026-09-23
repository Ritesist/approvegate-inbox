'use client';

import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface RejectModalProps {
  onClose: () => void;
  onReject: (reason: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({ onClose, onReject }) => {
  const [reason, setReason] = useState<string>('');
  const quickReasons = [
    'Tone not appropriate for enterprise tier',
    'Technical details inaccurate or outdated',
    'Customer issue resolved in another channel',
    'Needs escalation to engineering leadership',
    'Marked as spam or irrelevant inquiry',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onReject(reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-semibold text-slate-900">Reject AI Draft Response</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Quick Rejection Reasons
            </label>
            <div className="space-y-1.5">
              {quickReasons.map((qr) => (
                <button
                  type="button"
                  key={qr}
                  onClick={() => setReason(qr)}
                  className="w-full text-left text-xs py-1.5 px-2.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Rejection Note (Mandatory for Audit Trail)
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this draft is being rejected..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors disabled:opacity-40 shadow-sm"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
