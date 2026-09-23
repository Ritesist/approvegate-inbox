'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { parseCSVToThreads, parseJSONToThreads } from '@/lib/csv-parser';
import { TicketThread } from '@/lib/types';

interface IngestModalProps {
  onClose: () => void;
}

export const IngestModal: React.FC<IngestModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'sample'>('upload');
  const [pastedContent, setPastedContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedThreads, setParsedThreads] = useState<TicketThread[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let threads: TicketThread[] = [];
        if (file.name.endsWith('.json')) {
          threads = parseJSONToThreads(text);
        } else {
          threads = parseCSVToThreads(text);
        }

        if (threads.length === 0) {
          setError('No valid tickets could be parsed from the file. Check formatting.');
        } else {
          setParsedThreads(threads);
        }
      } catch (err: any) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleParsePasted = () => {
    setError(null);
    if (!pastedContent.trim()) {
      setError('Please paste CSV or JSON content first.');
      return;
    }

    try {
      let threads: TicketThread[] = [];
      if (pastedContent.trim().startsWith('[') || pastedContent.trim().startsWith('{')) {
        threads = parseJSONToThreads(pastedContent);
      } else {
        threads = parseCSVToThreads(pastedContent);
      }

      if (threads.length === 0) {
        setError('No valid tickets parsed. Ensure CSV has headers or JSON is an array of objects.');
      } else {
        setParsedThreads(threads);
      }
    } catch (err: any) {
      setError(`Parsing error: ${err.message}`);
    }
  };

  const handleCommitImport = async () => {
    if (parsedThreads.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threads: parsedThreads }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setSuccessCount(data.importedCount);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sampleCSV = `Subject,Body,From,Email,Tier
"Urgent: Payment failed on invoice #8812","Our payment was declined and our service is disrupted. Please assist.","Alice Walker","alice@company.com","enterprise"
"Feature request: Export to Google Sheets","Would love to export data directly to Sheets.","Bob Jones","bob@domain.org","pro"
"Question about SAML SSO setup","Where can I upload our IdP metadata file?","Carol White","carol@tech.co","vip"`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Ingest Support Tickets</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload Zendesk / Intercom / custom CSV or JSON exports. No OAuth required.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Upload File (CSV / JSON)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Paste Raw Text
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'sample'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sample Template
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully imported {successCount} tickets into the inbox! Reloading...</span>
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all text-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">
                  {fileName || 'Click to select CSV or JSON ticket export'}
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supports standard support desk export columns (Subject, Body, Email, Tier)
                </span>
                <input
                  type="file"
                  accept=".csv,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-2">
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Paste CSV text with headers (Subject, Body, Email...) or JSON array of tickets..."
                rows={7}
                className="w-full text-xs font-mono p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleParsePasted}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
              >
                Validate & Parse Content
              </button>
            </div>
          )}

          {activeTab === 'sample' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                You can copy the CSV template below to quickly create your test tickets:
              </p>
              <pre className="p-3 bg-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto text-slate-800 border border-slate-200">
                {sampleCSV}
              </pre>
              <button
                onClick={() => {
                  setPastedContent(sampleCSV);
                  setActiveTab('paste');
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-medium transition-colors"
              >
                Load Sample Into Paste Tab
              </button>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedThreads.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden mt-4">
              <div className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 flex justify-between items-center">
                <span>Parsed Tickets Ready to Ingest ({parsedThreads.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">Auto-detected schema</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {parsedThreads.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="truncate max-w-sm">
                      <span className="font-medium text-slate-900 block truncate">{t.subject}</span>
                      <span className="text-[11px] text-slate-500">From: {t.from.email}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {t.customerTier}
                    </span>
                  </div>
                ))}
                {parsedThreads.length > 5 && (
                  <div className="p-2 text-center text-xs text-slate-500 bg-slate-50">
                    + {parsedThreads.length - 5} more tickets
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCommitImport}
            disabled={parsedThreads.length === 0 || isSubmitting}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? 'Importing...' : `Import ${parsedThreads.length} Tickets`}
          </button>
        </div>
      </div>
    </div>
  );
};
