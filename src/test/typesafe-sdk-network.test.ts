import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the SDK client so the real network is never touched and no key is needed.
const systemOne = vi.fn();
vi.mock('@typesafe-ai/sdk', () => ({
  TypeSafeClient: vi.fn().mockImplementation(() => ({ systemOne })),
}));

import { judgeThread, clearJudgmentCache, TYPESAFE_MODEL, TYPESAFE_TIMEOUT_MS } from '../lib/typesafe';
import type { TicketThread } from '../lib/types';

const thread: TicketThread = {
  id: 'sdk-1',
  subject: 'Please refund the duplicate charge',
  from: { name: 'A', email: 'a@x.com' },
  receivedAt: '2026-09-23T10:00:00Z',
  channel: 'email',
  customerTier: 'pro',
  tags: [],
  rawBody: 'We were charged twice this month, please refund one of the charges.',
  threadMessages: [],
  triage: null,
  draft: null,
  approvalStatus: 'pending',
  snoozedUntil: null,
  status: 'open',
  auditLog: [],
};

describe('default SDK caller (network mocked)', () => {
  beforeEach(() => {
    clearJudgmentCache();
    systemOne.mockReset();
    process.env.TYPESAFE_API_KEY = 'test-fake-key-not-real';
  });
  afterEach(() => {
    delete process.env.TYPESAFE_API_KEY;
  });

  it('calls systemOne with jev-latest, the 4s timeout, and no retries', async () => {
    systemOne.mockResolvedValue({
      model: 'jev-x',
      answers: {
        needs_approval: { noul: 0.9 },
        action_type: { choice: 'refund', confidence: 0.85 },
        urgency: { score: 2, confidence: 0.8 },
      },
    });
    const j = await judgeThread(thread);
    expect(j.source).toBe('typesafe');
    expect(j.actionType).toBe('refund');
    const [body, opts] = systemOne.mock.calls[0];
    expect(body.model).toBe(TYPESAFE_MODEL);
    expect(Object.keys(body.questions).sort()).toEqual(['action_type', 'needs_approval', 'urgency']);
    expect(opts.timeout).toBe(TYPESAFE_TIMEOUT_MS);
    expect(opts.retry).toEqual({ maxRetries: 0 });
  });

  it('falls back when the SDK rejects with a network error', async () => {
    systemOne.mockRejectedValue(Object.assign(new TypeError('fetch failed'), { name: 'APIConnectionError' }));
    const j = await judgeThread(thread);
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('error:APIConnectionError');
  });

  it('falls back when the SDK returns a malformed payload', async () => {
    systemOne.mockResolvedValue({ answers: { needs_approval: {} } });
    const j = await judgeThread(thread);
    expect(j.fallbackReason).toBe('malformed_response');
  });
});
