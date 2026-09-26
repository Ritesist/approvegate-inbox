import 'server-only';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { runMockTriage } from './ai/mock-engine';
import type { Priority, SuggestedAction, TicketThread, ThreadJudgment } from './types';

/**
 * TypeSafe (Jev) typed judgments for each thread, with the existing rules
 * engine as a fallback. Server-only: the API key never reaches the browser.
 *
 * One request per thread asks three independent questions in parallel:
 *   - needs_approval (Noul): probability a human must sign off before anything is sent
 *   - action_type   (Choice): one of the app's SuggestedAction types
 *   - urgency       (Score): ordered levels mapped onto P3..P0
 * Only the subject and a short snippet are sent.
 */

export type ActionType = SuggestedAction['type'];

export const TYPESAFE_MODEL = 'jev-latest';
export const TYPESAFE_TIMEOUT_MS = 4000;
/** Below this, the Jev answer is discarded and the rules engine is used. */
export const FALLBACK_CONFIDENCE = 0.4;
/** Below this, the thread is flagged "Needs review" for a human. */
export const REVIEW_CONFIDENCE = 0.7;
const SNIPPET_CHARS = 280;
const BATCH_CONCURRENCY = 8;
const BATCH_DEADLINE_MS = 6000;

const URGENCY_LEVELS: Priority[] = ['P3', 'P2', 'P1', 'P0'];

export function buildQuestions() {
  return {
    needs_approval: {
      type: 'noul' as const,
      instructions:
        'Before anyone replies to or acts on `email`, should a human operator review and approve the response? Approval is needed when the message involves money (refunds, charges, invoices in dispute), security or data exposure, legal or contract commitments, account or access changes, a production incident, or an upset or high-value customer. Automated notifications, newsletters, spam, and simple FYI messages do not need approval.',
      criteria: {
        true: 'A human should approve the reply or action before it goes out',
        false: 'Routine or informational; no human approval needed',
      },
    },
    action_type: {
      type: 'choice' as const,
      instructions: 'What is the main next step the support team should take for `email`?',
      criteria: {
        escalation: 'Escalate to on-call, security, leadership, or an account executive right away',
        refund: 'Issue a refund, credit, or billing correction',
        investigation: 'Investigate a bug, error, or unclear report before responding',
        action: 'Perform a routine task or send a standard reply (for example schedule a demo, send an invoice copy, log feedback)',
        archive: 'No action needed; archive it (newsletter, automated notice, spam, misdirected mail)',
      },
    },
    urgency: {
      type: 'score' as const,
      instructions: 'How urgently does `email` need a response from the support team?',
      criteria: [
        'Can wait several days: newsletters, automated notices, spam, minor feedback or small requests',
        'Normal: should be handled within a business day or two, no active harm',
        'High: should be handled today; a significant bug, billing dispute, legal notice, or important deal',
        'Critical: needs attention within the hour; outage, security breach, active revenue loss, or legal or churn threat',
      ] as [string, string, string, string],
    },
  };
}

export function buildState(thread: Pick<TicketThread, 'subject' | 'rawBody'>) {
  const snippet = (thread.rawBody || '').replace(/\s+/g, ' ').trim().slice(0, SNIPPET_CHARS);
  return { email: { subject: thread.subject, snippet } };
}

export type TypeSafeCaller = (req: {
  state: ReturnType<typeof buildState>;
  questions: ReturnType<typeof buildQuestions>;
  signal?: AbortSignal;
}) => Promise<any>;

let cachedClient: TypeSafeClient | null = null;
const defaultCaller: TypeSafeCaller = async ({ state, questions, signal }) => {
  if (!cachedClient) {
    cachedClient = new TypeSafeClient({ timeout: TYPESAFE_TIMEOUT_MS, retry: { maxRetries: 0 }, logLevel: 'off' });
  }
  return cachedClient.systemOne(
    { state, questions, model: TYPESAFE_MODEL },
    { timeout: TYPESAFE_TIMEOUT_MS, retry: { maxRetries: 0 }, signal }
  );
};

export function isTypeSafeConfigured(): boolean {
  return Boolean(process.env.TYPESAFE_API_KEY && process.env.TYPESAFE_API_KEY.trim());
}

// ---------- In-memory cache (cost control) ----------
const cache = new Map<string, ThreadJudgment>();
function cacheKey(thread: TicketThread) {
  const s = buildState(thread).email;
  return `${thread.id}::${s.subject}::${s.snippet}`;
}
export function clearJudgmentCache() {
  cache.clear();
}
export function getCachedJudgment(thread: TicketThread): ThreadJudgment | undefined {
  return cache.get(cacheKey(thread));
}

// ---------- Heuristic fallback (existing rules engine) ----------
export function heuristicJudgment(thread: TicketThread, reason?: string): ThreadJudgment {
  const base = thread.triage && thread.draft ? { triage: thread.triage, draft: thread.draft } : runMockTriage(thread);
  const { triage, draft } = base;
  const actionType: ActionType = draft.suggestedActions[0]?.type ?? 'action';
  const needsApproval =
    triage.category === 'FYI' || actionType === 'archive'
      ? 0.1
      : triage.priority === 'P0' || triage.priority === 'P1' || actionType === 'refund' || actionType === 'escalation'
      ? 0.95
      : 0.75;
  return {
    source: 'heuristic',
    probability: needsApproval,
    needsApproval: needsApproval >= 0.5,
    actionType,
    urgency: triage.priority,
    confidence: triage.confidence,
    needsReview: triage.confidence < REVIEW_CONFIDENCE,
    fallbackReason: reason,
  };
}

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Convert a raw TypeSafe response into a judgment (or null if it is unusable). */
export function interpretTypeSafe(thread: TicketThread, res: any, latencyMs: number): ThreadJudgment {
  const a = res?.answers;
  const noul = a?.needs_approval?.noul;
  const choice = a?.action_type?.choice as ActionType | undefined;
  const choiceConf = a?.action_type?.confidence;
  const score = a?.urgency?.score;
  const scoreConf = a?.urgency?.confidence;
  if (
    typeof noul !== 'number' ||
    typeof score !== 'number' ||
    typeof choiceConf !== 'number' ||
    typeof scoreConf !== 'number' ||
    !choice
  ) {
    return heuristicJudgment(thread, 'malformed_response');
  }
  // Noul has no separate confidence; distance from 0.5 is its decisiveness.
  const noulDecisiveness = Math.abs(noul - 0.5) * 2;
  const confidence = Math.min(choiceConf, scoreConf);
  const idx = Math.max(0, Math.min(3, Math.round(score)));
  const jev = {
    probability: round(noul),
    actionType: choice,
    urgency: URGENCY_LEVELS[idx],
    urgencyScore: round(score),
    confidence: round(confidence),
    model: res?.model,
    latencyMs,
  };

  if (confidence < FALLBACK_CONFIDENCE) {
    const h = heuristicJudgment(thread, 'low_confidence');
    return { ...h, needsReview: true, typesafe: jev };
  }

  return {
    source: 'typesafe',
    probability: jev.probability,
    needsApproval: noul >= 0.5,
    actionType: choice,
    urgency: jev.urgency,
    urgencyScore: jev.urgencyScore,
    confidence: jev.confidence,
    needsReview: confidence < REVIEW_CONFIDENCE || noulDecisiveness < 0.3,
    model: jev.model,
    latencyMs,
  };
}

export async function judgeThread(
  thread: TicketThread,
  opts: { caller?: TypeSafeCaller; signal?: AbortSignal; useCache?: boolean; forceConfigured?: boolean } = {}
): Promise<ThreadJudgment> {
  const useCache = opts.useCache !== false;
  if (useCache) {
    const hit = cache.get(cacheKey(thread));
    if (hit) return { ...hit, cached: true };
  }
  if (!opts.caller && !opts.forceConfigured && !isTypeSafeConfigured()) {
    return heuristicJudgment(thread, 'no_api_key');
  }
  const caller = opts.caller ?? defaultCaller;
  const started = Date.now();
  try {
    const res = await withTimeout(
      caller({ state: buildState(thread), questions: buildQuestions(), signal: opts.signal }),
      TYPESAFE_TIMEOUT_MS + 250
    );
    const judgment = interpretTypeSafe(thread, res, Date.now() - started);
    // Cache real answers (including low-confidence ones) so reloads don't re-bill.
    if (judgment.source === 'typesafe' || judgment.typesafe) {
      cache.set(cacheKey(thread), judgment);
    }
    return judgment;
  } catch (err: any) {
    const reason = err?.name === 'APITimeoutError' || err?.message === 'timeout' ? 'timeout' : `error:${err?.status ?? err?.name ?? 'unknown'}`;
    return heuristicJudgment(thread, reason);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** Judge many threads with bounded concurrency and an overall deadline. */
export async function judgeThreads(
  threads: TicketThread[],
  opts: { caller?: TypeSafeCaller; mode?: 'auto' | 'heuristic' } = {}
): Promise<Map<string, ThreadJudgment>> {
  const out = new Map<string, ThreadJudgment>();
  if (opts.mode === 'heuristic' || (!opts.caller && !isTypeSafeConfigured())) {
    for (const t of threads) out.set(t.id, heuristicJudgment(t, opts.mode === 'heuristic' ? 'forced_rules' : 'no_api_key'));
    return out;
  }
  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), BATCH_DEADLINE_MS);
  const queue = [...threads];
  const worker = async () => {
    while (queue.length) {
      const t = queue.shift()!;
      if (controller.signal.aborted && !cache.has(cacheKey(t))) {
        out.set(t.id, heuristicJudgment(t, 'batch_deadline'));
        continue;
      }
      out.set(t.id, await judgeThread(t, { caller: opts.caller, signal: controller.signal }));
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(BATCH_CONCURRENCY, threads.length) }, worker));
  } finally {
    clearTimeout(deadline);
  }
  return out;
}

export function summarize(judgmentsIn: Iterable<ThreadJudgment>) {
  const judgments = Array.from(judgmentsIn);
  let typesafe = 0,
    heuristic = 0,
    needsReview = 0;
  for (const j of judgments) {
    if (j.source === 'typesafe') typesafe++;
    else heuristic++;
    if (j.needsReview) needsReview++;
  }
  return { typesafe, heuristic, needsReview, keyConfigured: isTypeSafeConfigured() };
}
