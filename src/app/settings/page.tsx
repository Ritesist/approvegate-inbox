'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Key, Database, CheckCircle2, RotateCcw, Cpu } from 'lucide-react';

export default function SettingsPage() {
  const [provider, setProvider] = useState<'mock' | 'openai' | 'gemini'>('mock');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          setProvider(data.config.provider || 'mock');
          setHasOpenAIKey(data.config.hasOpenAIKey);
          setHasGeminiKey(data.config.hasGeminiKey);
          if (data.config.openaiModel) setOpenaiModel(data.config.openaiModel);
          if (data.config.geminiModel) setGeminiModel(data.config.geminiModel);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          openaiApiKey: openaiKey || undefined,
          openaiModel,
          geminiApiKey: geminiKey || undefined,
          geminiModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage('Settings updated successfully.');
        setHasOpenAIKey(data.config.hasOpenAIKey);
        setHasGeminiKey(data.config.hasGeminiKey);
      }
    } catch (err: any) {
      setSaveMessage(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (confirm('Reset inbox to the default 36 messy support threads?')) {
      await fetch('/api/seed', { method: 'POST' });
      alert('Demo fixtures restored successfully.');
      window.location.href = '/';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            AI Engine & System Configuration
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure AI intelligence providers, deterministic mock mode, and data management.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* AI Intelligence Provider Selection */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Triage & Draft Intelligence Provider
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mock Provider Card */}
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                provider === 'mock'
                  ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  type="radio"
                  name="provider"
                  value="mock"
                  checked={provider === 'mock'}
                  onChange={() => setProvider('mock')}
                  className="text-purple-600"
                />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Recommended
                </span>
              </div>
              <span className="text-xs font-bold text-slate-900 block">Mock Engine</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Deterministic, fast, zero API key required. High-precision rule classifier tested against golden set.
              </p>
            </label>

            {/* OpenAI Provider Card */}
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                provider === 'openai'
                  ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  type="radio"
                  name="provider"
                  value="openai"
                  checked={provider === 'openai'}
                  onChange={() => setProvider('openai')}
                  className="text-purple-600"
                />
                {hasOpenAIKey && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Key Configured
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-900 block">OpenAI</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Uses GPT-4o or GPT-4o-mini with JSON response schemas. Falls back to mock if key is invalid.
              </p>
            </label>

            {/* Google Gemini Provider Card */}
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                provider === 'gemini'
                  ? 'border-purple-600 bg-purple-50/40 ring-1 ring-purple-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  type="radio"
                  name="provider"
                  value="gemini"
                  checked={provider === 'gemini'}
                  onChange={() => setProvider('gemini')}
                  className="text-purple-600"
                />
                {hasGeminiKey && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Key Configured
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-slate-900 block">Google Gemini</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Uses Gemini 1.5 Flash or Pro with structured JSON generation.
              </p>
            </label>
          </div>

          {/* Conditional Credentials for OpenAI */}
          {provider === 'openai' && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-semibold text-slate-800">OpenAI Credentials</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    API Key (or set via OPENAI_API_KEY env)
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={hasOpenAIKey ? '••••••••••••••••' : 'sk-...'}
                    className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Model Selection
                  </label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:outline-none"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient)</option>
                    <option value="gpt-4o">gpt-4o (High capability)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Conditional Credentials for Gemini */}
          {provider === 'gemini' && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-semibold text-slate-800">Gemini Credentials</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    API Key (or set via GEMINI_API_KEY env)
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={hasGeminiKey ? '••••••••••••••••' : 'AIzaSy...'}
                    className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Model Selection
                  </label>
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:outline-none"
                  >
                    <option value="gemini-1.5-flash">gemini-1.5-flash (Low latency)</option>
                    <option value="gemini-1.5-pro">gemini-1.5-pro (Deep reasoning)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Engine Settings'}
            </button>
          </div>
        </div>
      </form>

      {/* Invariant Policy Overview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Hard Human-Approve Gate Policy Specification
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The ApproveGate Inbox architecture is specifically engineered to solve the autonomous AI agent safety problem: <strong>hallucinations or unintended customer commitments must never reach an external user without verified human sign-off.</strong>
        </p>
        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
          <li><strong>Invariant Rule:</strong> Server-side API refuses any send invocation unless both status is &apos;approved&apos; and a preceding Operator approval record exists in the audit ledger.</li>
          <li><strong>Zero Auto-Send:</strong> No background task, cron, or automated webhook is permitted to transition a thread into &apos;sent&apos; status.</li>
          <li><strong>Re-Approval Invalidation:</strong> Editing any draft automatically revokes previous approval, returning it to &apos;pending&apos;.</li>
        </ul>
      </div>

      {/* Fixture & Data Maintenance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Database className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">Data & Fixture Management</h3>
        </div>
        <p className="text-xs text-slate-500">
          Need to reset the environment for a clean demonstration? This restores the built-in ~36 messy support threads, clears transient edits, and resets the audit ledger to initial ingestion.
        </p>
        <div>
          <button
            onClick={handleResetDemo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Inbox to Built-in Fixture
          </button>
        </div>
      </div>
    </div>
  );
}
