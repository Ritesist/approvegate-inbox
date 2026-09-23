import fs from 'fs';
import path from 'path';
import {
  TicketThread,
  AuditLogEntry,
  ApprovalStatus,
  DraftReplyData,
  TriageData,
  SuggestedAction,
} from './types';
import { triageThread } from './ai/engine';
import messyInboxFixture from '../../data/fixtures/messy-inbox.json';

// Invariant error class
export class ApproveGateInvariantViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApproveGateInvariantViolationError';
  }
}

interface DatabaseState {
  threads: TicketThread[];
  auditLogs: AuditLogEntry[];
}

let inMemoryDb: DatabaseState | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'store.json');
const FIXTURES_PATH = path.resolve(DATA_DIR, 'fixtures', 'messy-inbox.json');

const IS_SERVERLESS = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY
);

let isFsReadOnly = IS_SERVERLESS;

function ensureDataDirectory() {
  if (isFsReadOnly) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err: any) {
    if (err?.code === 'EROFS' || err?.code === 'EACCES') {
      isFsReadOnly = true;
    }
    console.warn('Could not create data directory, maintaining in-memory state only:', err);
  }
}

function loadInitialFixtures(): TicketThread[] {
  let rawList: any[] = [];
  try {
    if (fs.existsSync(FIXTURES_PATH)) {
      const raw = fs.readFileSync(FIXTURES_PATH, 'utf-8');
      rawList = JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading fixture file from disk, using bundled fixture fallback:', err);
  }

  if (!rawList || rawList.length === 0) {
    rawList = messyInboxFixture as any[];
  }

  return rawList.map((item: any) => ({
    id: item.id,
    subject: item.subject,
    from: item.from,
    receivedAt: item.receivedAt,
    channel: item.channel || 'email',
    customerTier: item.customerTier || 'pro',
    tags: item.tags || [],
    rawBody: item.rawBody,
    threadMessages: item.threadMessages || [],
    triage: item.triage || null,
    draft: item.draft || null,
    approvalStatus: item.approvalStatus || 'pending',
    snoozedUntil: item.snoozedUntil || null,
    status: item.status || 'open',
    auditLog: item.auditLog || [
      {
        id: `audit-init-${item.id}`,
        threadId: item.id,
        timestamp: item.receivedAt,
        actor: 'System',
        action: 'thread_imported',
        note: 'Ingested from inbox feed',
      },
    ],
  }));
}

function saveToDisk(state: DatabaseState) {
  if (isFsReadOnly) {
    // In serverless / read-only filesystem environments, state remains in-memory
    return;
  }
  try {
    ensureDataDirectory();
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err: any) {
    if (err?.code === 'EROFS' || err?.code === 'EACCES') {
      isFsReadOnly = true;
    }
    // Non-fatal if filesystem is read-only (e.g. serverless)
    console.warn('Unable to persist to disk, maintaining in-memory state:', err);
  }
}

function getDatabase(): DatabaseState {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  // Try loading from store.json if available
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      inMemoryDb = JSON.parse(raw);
      return inMemoryDb!;
    }
  } catch (err) {
    console.warn('Failed to parse store.json, re-initializing from fixtures:', err);
  }

  // Fallback to fresh fixtures
  const initialThreads = loadInitialFixtures();
  const allInitialAudits = initialThreads.flatMap((t) => t.auditLog);
  inMemoryDb = {
    threads: initialThreads,
    auditLogs: allInitialAudits,
  };
  saveToDisk(inMemoryDb);
  return inMemoryDb;
}

export function getAllThreads(): TicketThread[] {
  const db = getDatabase();
  return [...db.threads];
}

export function getThreadById(id: string): TicketThread | null {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === id);
  return thread ? { ...thread } : null;
}

export function getAllAuditLogs(): AuditLogEntry[] {
  const db = getDatabase();
  return [...db.auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getAuditLogsForThread(threadId: string): AuditLogEntry[] {
  const db = getDatabase();
  return db.auditLogs
    .filter((a) => a.threadId === threadId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function triageThreadInStore(threadId: string): Promise<TicketThread> {
  const db = getDatabase();
  const index = db.threads.findIndex((t) => t.id === threadId);
  if (index === -1) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const thread = db.threads[index];
  const { triage, draft } = await triageThread(thread);

  const triageAudit: AuditLogEntry = {
    id: `audit-triage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: new Date().toISOString(),
    actor: 'AI Butler',
    action: 'triage_performed',
    note: `Assigned ${triage.priority} (${triage.category}) to ${triage.suggestedOwner}. Confidence: ${(triage.confidence * 100).toFixed(0)}%`,
  };

  const draftAudit: AuditLogEntry = {
    id: `audit-draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: new Date().toISOString(),
    actor: 'AI Butler',
    action: 'draft_generated',
    note: `Generated reply draft (${draft.tone} tone) with ${draft.suggestedActions.length} suggested actions. Awaiting human approval.`,
    draftSnapshot: draft.body,
  };

  thread.triage = triage;
  thread.draft = draft;
  thread.auditLog.push(triageAudit, draftAudit);
  db.auditLogs.push(triageAudit, draftAudit);

  saveToDisk(db);
  return { ...thread };
}

export async function triageAllUntriaged(): Promise<{ count: number }> {
  const db = getDatabase();
  let count = 0;
  for (const thread of db.threads) {
    if (!thread.triage) {
      await triageThreadInStore(thread.id);
      count++;
    }
  }
  return { count };
}

export function approveDraft(threadId: string, note?: string): TicketThread {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread) throw new Error(`Thread not found: ${threadId}`);
  if (!thread.draft) throw new Error(`Cannot approve thread without generated draft: ${threadId}`);

  const previousStatus = thread.approvalStatus;
  thread.approvalStatus = 'approved';

  const audit: AuditLogEntry = {
    id: `audit-appr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: new Date().toISOString(),
    actor: 'Operator',
    action: 'draft_approved',
    previousStatus,
    newStatus: 'approved',
    note: note || 'Draft reviewed and approved by operator. Ready for authorized dispatch.',
    draftSnapshot: thread.draft.body,
  };

  thread.auditLog.push(audit);
  db.auditLogs.push(audit);
  saveToDisk(db);
  return { ...thread };
}

export function editDraft(
  threadId: string,
  updatedBody: string,
  updatedActions?: SuggestedAction[],
  note?: string
): TicketThread {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread) throw new Error(`Thread not found: ${threadId}`);
  if (!thread.draft) throw new Error(`Cannot edit thread without draft: ${threadId}`);

  const previousBody = thread.draft.body;
  thread.draft.body = updatedBody;
  if (updatedActions) {
    thread.draft.suggestedActions = updatedActions;
  }
  thread.draft.version += 1;
  thread.draft.lastModifiedAt = new Date().toISOString();
  thread.draft.lastModifiedBy = 'operator';

  // If was previously approved, editing resets it back to pending for safety!
  const previousStatus = thread.approvalStatus;
  if (thread.approvalStatus === 'approved') {
    thread.approvalStatus = 'pending';
  }

  const audit: AuditLogEntry = {
    id: `audit-edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: new Date().toISOString(),
    actor: 'Operator',
    action: 'draft_edited',
    previousStatus,
    newStatus: thread.approvalStatus,
    note: note || `Draft modified (v${thread.draft.version}). Previous length: ${previousBody.length} chars, new length: ${updatedBody.length} chars.`,
    draftSnapshot: updatedBody,
  };

  thread.auditLog.push(audit);
  db.auditLogs.push(audit);
  saveToDisk(db);
  return { ...thread };
}

export function rejectDraft(threadId: string, reason: string): TicketThread {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread) throw new Error(`Thread not found: ${threadId}`);

  const previousStatus = thread.approvalStatus;
  thread.approvalStatus = 'rejected';

  const audit: AuditLogEntry = {
    id: `audit-rej-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: new Date().toISOString(),
    actor: 'Operator',
    action: 'draft_rejected',
    previousStatus,
    newStatus: 'rejected',
    note: reason || 'Draft rejected by operator.',
    draftSnapshot: thread.draft?.body,
  };

  thread.auditLog.push(audit);
  db.auditLogs.push(audit);
  saveToDisk(db);
  return { ...thread };
}

export function snoozeDraft(threadId: string, hours = 24, reason?: string): TicketThread {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread) throw new Error(`Thread not found: ${threadId}`);

  const previousStatus = thread.approvalStatus;
  const snoozeDate = new Date(Date.now() + hours * 3600 * 1000);
  thread.approvalStatus = 'snoozed';
  thread.snoozedUntil = snoozeDate.toISOString();

  const audit: AuditLogEntry = {
    id: `audit-snz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: new Date().toISOString(),
    actor: 'Operator',
    action: 'draft_snoozed',
    previousStatus,
    newStatus: 'snoozed',
    note: reason || `Snoozed for ${hours} hours until ${snoozeDate.toLocaleTimeString()}`,
  };

  thread.auditLog.push(audit);
  db.auditLogs.push(audit);
  saveToDisk(db);
  return { ...thread };
}

export function toggleActionItem(threadId: string, actionId: string): TicketThread {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread || !thread.draft) throw new Error(`Thread draft not found: ${threadId}`);

  const action = thread.draft.suggestedActions.find((a) => a.id === actionId);
  if (action) {
    action.completed = !action.completed;
    const audit: AuditLogEntry = {
      id: `audit-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threadId,
      timestamp: new Date().toISOString(),
      actor: 'Operator',
      action: 'action_toggled',
      note: `Toggled action "${action.title}" to ${action.completed ? 'completed' : 'pending'}`,
    };
    thread.auditLog.push(audit);
    db.auditLogs.push(audit);
    saveToDisk(db);
  }
  return { ...thread };
}

/**
 * HARD APPROVE-GATE INVARIANT ENFORCEMENT
 * Zero auto-send guarantee.
 * A message can NEVER be sent unless:
 * 1. thread.approvalStatus === 'approved'
 * 2. There is an explicit prior audit entry with action === 'draft_approved' recorded by 'Operator'
 */
export function sendApprovedReply(threadId: string): { success: boolean; thread: TicketThread } {
  const db = getDatabase();
  const thread = db.threads.find((t) => t.id === threadId);
  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  // Invariant verification check 1: Status must be 'approved'
  const isApprovedStatus = thread.approvalStatus === 'approved';

  // Invariant verification check 2: Audit log must contain explicit operator approval
  const hasOperatorApprovalRecord = thread.auditLog.some(
    (log) => log.action === 'draft_approved' && log.actor === 'Operator'
  );

  if (!isApprovedStatus || !hasOperatorApprovalRecord) {
    // Invariant violation! Log security event and refuse execution
    const blockedAudit: AuditLogEntry = {
      id: `audit-block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      threadId,
      timestamp: new Date().toISOString(),
      actor: 'System',
      action: 'send_blocked',
      previousStatus: thread.approvalStatus,
      newStatus: thread.approvalStatus,
      note: `CRITICAL INVARIANT PREVENTED SEND: Attempted to send thread ${threadId} without operator approval (status: ${thread.approvalStatus}, hasApprovalRecord: ${hasOperatorApprovalRecord}).`,
    };
    thread.auditLog.push(blockedAudit);
    db.auditLogs.push(blockedAudit);
    saveToDisk(db);

    throw new ApproveGateInvariantViolationError(
      `ApproveGate Hard Invariant Violation: Outbound send blocked for thread ${threadId}. Reason: Draft has status '${thread.approvalStatus}' and lacks verified human operator approval.`
    );
  }

  // Both invariant checks passed -> Execute authorized dispatch
  const previousStatus = thread.approvalStatus;
  thread.approvalStatus = 'sent';
  thread.status = 'resolved';
  thread.sentAt = new Date().toISOString();

  const sendAudit: AuditLogEntry = {
    id: `audit-send-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    threadId,
    timestamp: thread.sentAt,
    actor: 'Operator',
    action: 'reply_sent',
    previousStatus,
    newStatus: 'sent',
    note: `Dispatched reply to ${thread.from.email}. Zero auto-send gate verified.`,
    draftSnapshot: thread.draft?.body,
  };

  thread.auditLog.push(sendAudit);
  db.auditLogs.push(sendAudit);
  saveToDisk(db);

  return { success: true, thread: { ...thread } };
}

export function resetToDemoFixture(): { threadCount: number } {
  const initialThreads = loadInitialFixtures();
  const allInitialAudits = initialThreads.flatMap((t) => t.auditLog);
  inMemoryDb = {
    threads: initialThreads,
    auditLogs: allInitialAudits,
  };
  saveToDisk(inMemoryDb);
  return { threadCount: initialThreads.length };
}

export function importTickets(newThreads: TicketThread[]): { importedCount: number } {
  const db = getDatabase();
  const existingIds = new Set(db.threads.map((t) => t.id));

  let importedCount = 0;
  for (const t of newThreads) {
    if (!existingIds.has(t.id)) {
      db.threads.unshift(t);
      db.auditLogs.push(...t.auditLog);
      existingIds.add(t.id);
      importedCount++;
    }
  }

  saveToDisk(db);
  return { importedCount };
}
