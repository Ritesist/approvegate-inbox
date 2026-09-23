'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

interface SnoozeModalProps {
  onClose: () => void;
  onSnooze: (hours: number, reason: string) => void;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({ onClose, onSnooze }) => {
  const [hours, setHours] = useState<number>(24);
  const [reason, setReason] = useState<string>('Awaiting customer or internal team response');

  const options = [
    { label: '1 Hour', value: 1 },
    { label: '4 Hours', value: 4 },
    { label: '24 Hours (Tomorrow)', value: 24 },
    { label: '48 Hours', value: 48 },
    { label: '7 Days (Next Week)', value: 168 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSnooze(hours, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-900">Snooze Approval Review</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Snooze Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setHours(opt.value)}
                  className={`text-xs py-2 px-3 rounded-lg border text-left font-medium transition-colors ${
                    hours === opt.value
                      ? 'bg-purple-50 border-purple-300 text-purple-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason / Reminder Note (Recorded in Audit Log)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm"
            >
              Confirm Snooze
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
