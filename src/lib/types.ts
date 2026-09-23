export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Category = 'billing' | 'bug' | 'sales' | 'FYI' | 'other';
export type CustomerTier = 'free' | 'pro' | 'enterprise' | 'vip';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'snoozed' | 'sent';
export type ThreadStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export interface ThreadMessage {
  id: string;
  sender: string;
  email: string;
  timestamp: string;
  body: string;
  isInternal?: boolean;
}

export interface SuggestedAction {
  id: string;
  title: string;
  type: 'action' | 'escalation' | 'refund' | 'investigation' | 'archive';
  completed: boolean;
  systemTarget?: string;
}

export interface TriageData {
  priority: Priority;
  category: Category;
  summary: string;
  suggestedOwner: string;
  dueBy: string;
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'urgent';
  confidence: number;
  reasoning: string;
}

export interface DraftReplyData {
  id: string;
  threadId: string;
  recipient: string;
  subject: string;
  body: string;
  tone: 'professional' | 'apologetic' | 'technical' | 'direct';
  suggestedActions: SuggestedAction[];
  version: number;
  lastModifiedAt: string;
  lastModifiedBy: 'ai' | 'operator';
}

export interface AuditLogEntry {
  id: string;
  threadId: string;
  timestamp: string;
  actor: 'AI Butler' | 'Operator' | 'System';
  action:
    | 'triage_performed'
    | 'draft_generated'
    | 'draft_edited'
    | 'draft_approved'
    | 'draft_rejected'
    | 'draft_snoozed'
    | 'reply_sent'
    | 'send_blocked'
    | 'thread_imported'
    | 'action_toggled';
  previousStatus?: ApprovalStatus;
  newStatus?: ApprovalStatus;
  note?: string;
  draftSnapshot?: string;
}

export interface TicketThread {
  id: string;
  subject: string;
  from: {
    name: string;
    email: string;
    company?: string;
  };
  receivedAt: string;
  channel: 'email' | 'web' | 'api' | 'support_portal';
  threadMessages: ThreadMessage[];
  rawBody: string;
  tags: string[];
  customerTier: CustomerTier;
  triage: TriageData | null;
  draft: DraftReplyData | null;
  approvalStatus: ApprovalStatus;
  snoozedUntil: string | null;
  status: ThreadStatus;
  auditLog: AuditLogEntry[];
  sentAt?: string;
}

export interface GoldenLabel {
  threadId: string;
  subjectSnippet?: string;
  expectedPriority: Priority;
  expectedCategory: Category;
  expectedOwner: string;
  difficulty?: 'straightforward' | 'ambiguous' | 'edge_case';
  notes?: string;
}

export interface EvalMetrics {
  totalCount: number;
  evaluatedCount: number;
  priorityAccuracy: number;
  priorityMetrics: Record<
    Priority,
    {
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }
  >;
  categoryAccuracy: number;
  categoryMetrics: Record<
    Category,
    {
      precision: number;
      recall: number;
      f1: number;
      support: number;
    }
  >;
  invariantPassed: boolean;
  invariantDetails: {
    totalSent: number;
    approvedBeforeSend: number;
    unauthorizedSendsAttempted: number;
    unauthorizedSendsBlocked: number;
    violationsDetected: number;
  };
  mismatches: Array<{
    threadId: string;
    subject: string;
    predictedPriority: Priority;
    expectedPriority: Priority;
    predictedCategory: Category;
    expectedCategory: Category;
    predictedOwner: string;
    expectedOwner: string;
  }>;
}

export interface LLMConfig {
  provider: 'mock' | 'openai' | 'gemini';
  openaiApiKey?: string;
  openaiModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
}
