import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  judgeThread,
  judgeThreads,
  clearJudgmentCache,
  buildState,
  type TypeSafeCaller,
} from '../lib/typesafe';
import { TicketThread } from '../lib/types';

function makeThread(overrides: Partial<TicketThread> = {}): TicketThread {
  return {
    id: 'ts-test-1',
    subject: 'Unauthorized charge of $4,200 on our card',
    from: { name: 'Dana Finance', email: 'dana@acme.com' },
    receivedAt: '2026-09-23T10:00:00Z',
    channel: 'email',
    customerTier: 'enterprise',
    tags: [],
    rawBody: 'We see an unauthorized charge of $4,200. Refund it or we will file an immediate chargeback. '.repeat(10),
    threadMessages: [],
    triage: null,
    draft: null,
    approvalStatus: 'pending',
    snoozedUntil: null,
    status: 'open',
    auditLog: [],
    ...overrides,
  };
}

const goodResponse = {
  model: 'jev-1.13.0',
  answers: {
    needs_approval: { type: 'noul', noul: 0.93 },
    action_type: { type: 'choice', choice: 'refund', confidence: 0.88, probabilities: {} },
    urgency: { type: 'score', score: 2.9, confidence: 0.81, legend: {}, probabilities: {} },
  },
  usage: { input_tokens: 300, output_tokens: 40 },
};

describe('TypeSafe judgment with heuristic fallback', () => {
  const savedKey = process.env.TYPESAFE_API_KEY;
  beforeEach(() => clearJudgmentCache());
  afterEach(() => {
    if (savedKey === undefined) delete process.env.TYPESAFE_API_KEY;
    else process.env.TYPESAFE_API_KEY = savedKey;
  });

  it('falls back to rules when the TypeSafe call fails', async () => {
    const failing: TypeSafeCaller = async () => {
      throw Object.assign(new Error('boom'), { status: 529 });
    };
    const j = await judgeThread(makeThread(), { caller: failing });
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('error:529');
    expect(j.urgency).toBe('P0');
    expect(j.needsApproval).toBe(true);
  });

  it('falls back to rules when no API key is configured', async () => {
    delete process.env.TYPESAFE_API_KEY;
    const j = await judgeThread(makeThread());
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('no_api_key');
  });

  it('falls back to rules and flags review on low confidence', async () => {
    const lowConf: TypeSafeCaller = async () => ({
      ...goodResponse,
      answers: {
        ...goodResponse.answers,
        action_type: { ...goodResponse.answers.action_type, confidence: 0.2 },
      },
    });
    const j = await judgeThread(makeThread(), { caller: lowConf });
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('low_confidence');
    expect(j.needsReview).toBe(true);
    expect(j.typesafe?.confidence).toBe(0.2);
  });

  it('uses Jev answers when confident, caches them, and sends only subject + snippet', async () => {
    let calls = 0;
    let sentState: any;
    const ok: TypeSafeCaller = async ({ state }) => {
      calls++;
      sentState = state;
      return goodResponse;
    };
    const thread = makeThread();
    const j = await judgeThread(thread, { caller: ok });
    expect(j.source).toBe('typesafe');
    expect(j.probability).toBe(0.93);
    expect(j.actionType).toBe('refund');
    expect(j.urgency).toBe('P0');
    expect(j.needsReview).toBe(false);
    expect(Object.keys(sentState.email)).toEqual(['subject', 'snippet']);
    expect(sentState.email.snippet.length).toBeLessThanOrEqual(280);

    const again = await judgeThread(thread, { caller: ok });
    expect(again.cached).toBe(true);
    expect(calls).toBe(1);
  });

  it('batch judging never throws and returns one judgment per thread', async () => {
    const flaky: TypeSafeCaller = async ({ state }) => {
      if (state.email.subject.includes('fail')) throw new Error('network');
      return goodResponse;
    };
    const threads = [makeThread({ id: 'a' }), makeThread({ id: 'b', subject: 'please fail' })];
    const out = await judgeThreads(threads, { caller: flaky });
    expect(out.get('a')?.source).toBe('typesafe');
    expect(out.get('b')?.source).toBe('heuristic');
    expect(buildState(threads[0]).email.subject).toBe(threads[0].subject);
  });
});
