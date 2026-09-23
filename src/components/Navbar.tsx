'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldCheck,
  Inbox,
  BarChart3,
  History,
  Settings,
  Upload,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { IngestModal } from './IngestModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [showIngest, setShowIngest] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTriagingAll, setIsTriagingAll] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (confirm('Reset inbox to the default demo fixture (~36 messy support threads)?')) {
      setIsResetting(true);
      try {
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();
        setMessage(`Reset complete: ${data.threadCount} demo threads reloaded.`);
        setTimeout(() => {
          window.location.href = '/';
        }, 800);
      } catch (err) {
        console.error(err);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleTriageAll = async () => {
    setIsTriagingAll(true);
    try {
      const res = await fetch('/api/triage-all', { method: 'POST' });
      const data = await res.json();
      setMessage(`Batch triage completed: ${data.triagedCount} tickets triaged.`);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriagingAll(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Inbox & Triage', icon: Inbox },
    { href: '/eval', label: 'Evaluation & Invariants', icon: BarChart3 },
    { href: '/audit', label: 'Audit Trail', icon: History },
    { href: '/settings', label: 'Engine & Settings', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base tracking-tight">ApproveGate</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Inbox-to-Action Butler
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">
                    Hard Human-in-the-Loop Gate
                  </p>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 ml-4">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-slate-100 text-blue-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleTriageAll}
                disabled={isTriagingAll}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                title="Automatically triage all pending untriaged threads"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isTriagingAll ? 'Triaging...' : 'Triage All'}
              </button>

              <button
                onClick={() => setShowIngest(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-colors"
                title="Upload CSV or JSON ticket export"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ingest</span>
              </button>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-50"
                title="Reset to 36 built-in demo threads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>

              <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mock Mode (Zero-Key Active)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {message && (
          <div className="bg-blue-600 text-white text-xs py-1.5 px-4 text-center font-medium shadow-sm transition-all">
            {message}
          </div>
        )}
      </header>

      {/* Ingest Modal */}
      {showIngest && <IngestModal onClose={() => setShowIngest(false)} />}
    </>
  );
};
