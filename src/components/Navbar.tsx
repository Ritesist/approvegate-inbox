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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm tracking-tight">ApproveGate</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-medium">
                      Inbox Butler
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-none mt-0.5">
                    Hard Human-in-the-Loop Gate
                  </p>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 ml-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriageAll}
                disabled={isTriagingAll}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 transition-colors disabled:opacity-50"
                title="Automatically triage all pending untriaged threads"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isTriagingAll ? 'Triaging...' : 'Triage All'}
              </button>

              <button
                onClick={() => setShowIngest(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors"
                title="Upload CSV or JSON ticket export"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ingest</span>
              </button>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors disabled:opacity-50"
                title="Reset to 36 built-in demo threads"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Demo</span>
              </button>

              <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Mock Mode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {message && (
          <div className="bg-slate-900 text-white text-xs py-1.5 px-4 text-center font-medium transition-all">
            {message}
          </div>
        )}
      </header>

      {/* Ingest Modal */}
      {showIngest && <IngestModal onClose={() => setShowIngest(false)} />}
    </>
  );
};
