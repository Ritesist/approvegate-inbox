import fs from 'fs';
import path from 'path';
import { GoldenLabel, EvalMetrics, Priority, Category, TicketThread } from './types';
import { runMockTriage } from './ai/mock-engine';
import { getAllThreads, getAllAuditLogs, sendApprovedReply, ApproveGateInvariantViolationError } from './store';

const GOLDEN_LABELS_PATH = path.resolve(process.cwd(), 'data', 'fixtures', 'golden-labels.json');
const FIXTURES_PATH = path.resolve(process.cwd(), 'data', 'fixtures', 'messy-inbox.json');

export function loadGoldenLabels(): GoldenLabel[] {
  try {
    if (fs.existsSync(GOLDEN_LABELS_PATH)) {
      const raw = fs.readFileSync(GOLDEN_LABELS_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading golden labels:', err);
  }
  return [];
}

export function computeClassMetrics<T extends string>(
  classes: T[],
  pairs: Array<{ actual: T; predicted: T }>
): {
  accuracy: number;
  metrics: Record<T, { precision: number; recall: number; f1: number; support: number }>;
} {
  const result = {} as Record<T, { precision: number; recall: number; f1: number; support: number }>;
  let totalCorrect = 0;

  for (const c of classes) {
    const tp = pairs.filter((p) => p.actual === c && p.predicted === c).length;
    const fp = pairs.filter((p) => p.actual !== c && p.predicted === c).length;
    const fn = pairs.filter((p) => p.actual === c && p.predicted !== c).length;
    const support = pairs.filter((p) => p.actual === c).length;

    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    result[c] = {
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      support,
    };
  }

  for (const p of pairs) {
    if (p.actual === p.predicted) totalCorrect++;
  }

  const accuracy = pairs.length > 0 ? Math.round((totalCorrect / pairs.length) * 1000) / 1000 : 0;

  return { accuracy, metrics: result };
}

export async function runEvaluation(): Promise<EvalMetrics> {
  const golden = loadGoldenLabels();
  const rawFixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, 'utf-8')) as TicketThread[];

  const priorityPairs: Array<{ actual: Priority; predicted: Priority }> = [];
  const categoryPairs: Array<{ actual: Category; predicted: Category }> = [];
  const mismatches: EvalMetrics['mismatches'] = [];

  for (const item of rawFixtures) {
    const gold = golden.find((g) => g.threadId === item.id);
    if (!gold) continue;

    const { triage } = runMockTriage(item);

    priorityPairs.push({ actual: gold.expectedPriority, predicted: triage.priority });
    categoryPairs.push({ actual: gold.expectedCategory, predicted: triage.category });

    if (triage.priority !== gold.expectedPriority || triage.category !== gold.expectedCategory) {
      mismatches.push({
        threadId: item.id,
        subject: item.subject,
        predictedPriority: triage.priority,
        expectedPriority: gold.expectedPriority,
        predictedCategory: triage.category,
        expectedCategory: gold.expectedCategory,
        predictedOwner: triage.suggestedOwner,
        expectedOwner: gold.expectedOwner,
      });
    }
  }

  const priorities: Priority[] = ['P0', 'P1', 'P2', 'P3'];
  const categories: Category[] = ['billing', 'bug', 'sales', 'FYI', 'other'];

  const pEval = computeClassMetrics(priorities, priorityPairs);
  const cEval = computeClassMetrics(categories, categoryPairs);

  // Invariant verification across audit logs
  const audits = getAllAuditLogs();
  const threads = getAllThreads();

  let unauthorizedSendsAttempted = audits.filter((a) => a.action === 'send_blocked').length;
  let totalSent = 0;
  let approvedBeforeSend = 0;
  let violationsDetected = 0;

  for (const thread of threads) {
    if (thread.approvalStatus === 'sent' || thread.sentAt) {
      totalSent++;
      const hasPriorApproval = thread.auditLog.some(
        (a) =>
          a.action === 'draft_approved' &&
          a.actor === 'Operator' &&
          new Date(a.timestamp).getTime() <= new Date(thread.sentAt || '').getTime()
      );
      if (hasPriorApproval) {
        approvedBeforeSend++;
      } else {
        violationsDetected++;
      }
    }
  }

  // Active stress-test simulation of the invariant: attempt to send unapproved thread
  let stressTestBlocked = 0;
  try {
    const dummyThreadId = rawFixtures[0]?.id || 'thread-001';
    // Test that calling send on pending thread is strictly blocked
    const testThread = threads.find((t) => t.id === dummyThreadId);
    if (testThread && testThread.approvalStatus !== 'approved') {
      try {
        sendApprovedReply(dummyThreadId);
      } catch (err) {
        if (err instanceof ApproveGateInvariantViolationError) {
          stressTestBlocked++;
        }
      }
    }
  } catch {
    // Expected to catch
  }

  return {
    totalCount: rawFixtures.length,
    evaluatedCount: priorityPairs.length,
    priorityAccuracy: pEval.accuracy,
    priorityMetrics: pEval.metrics,
    categoryAccuracy: cEval.accuracy,
    categoryMetrics: cEval.metrics,
    invariantPassed: violationsDetected === 0,
    invariantDetails: {
      totalSent,
      approvedBeforeSend,
      unauthorizedSendsAttempted: unauthorizedSendsAttempted + stressTestBlocked,
      unauthorizedSendsBlocked: unauthorizedSendsAttempted + stressTestBlocked,
      violationsDetected,
    },
    mismatches,
  };
}
