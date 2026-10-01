import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  judgeThread,
  judgeThreads,
  clearJudgmentCache,
  interpretTypeSafe,
  summarize,
  isTypeSafeConfigured,
  REVIEW_CONFIDENCE,
  FALLBACK_CONFIDENCE,
  TYPESAFE_TIMEOUT_MS,
  type TypeSafeCaller,
} from '../lib/typesafe';
import { TicketThread } from '../lib/types';

function makeThread(overrides: Partial<TicketThread> = {}): TicketThread {
  return {
    id: 'rel-1',
    subject: 'Production API returning 500s for all customers',
    from: { name: 'Ops', email: 'ops@bigco.com' },
    receivedAt: '2026-09-23T10:00:00Z',
    channel: 'email',
    customerTier: 'enterprise',
    tags: [],
    rawBody: 'Our production integration is down, every call returns HTTP 500. This is an outage.',
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

function response(opts: { noul?: number; choiceConf?: number; scoreConf?: number; score?: number; choice?: string } = {}) {
  return {
    model: 'jev-test',
    answers: {
      needs_approval: { type: 'noul', noul: opts.noul ?? 0.9 },
      action_type: { type: 'choice', choice: opts.choice ?? 'escalation', confidence: opts.choiceConf ?? 0.9 },
      urgency: { type: 'score', score: opts.score ?? 3, confidence: opts.scoreConf ?? 0.9 },
    },
  };
}

const savedKey = process.env.TYPESAFE_API_KEY;
beforeEach(() => clearJudgmentCache());
afterEach(() => {
  vi.useRealTimers();
  if (savedKey === undefined) delete process.env.TYPESAFE_API_KEY;
  else process.env.TYPESAFE_API_KEY = savedKey;
});

describe('timeout and network failures fall back to rules', () => {
  it('uses a 4 second TypeSafe timeout', () => {
    expect(TYPESAFE_TIMEOUT_MS).toBe(4000);
  });

  it('falls back with reason "timeout" when TypeSafe never answers', async () => {
    vi.useFakeTimers();
    const hanging: TypeSafeCaller = () => new Promise(() => {});
    const p = judgeThread(makeThread(), { caller: hanging });
    await vi.advanceTimersByTimeAsync(TYPESAFE_TIMEOUT_MS + 300);
    const j = await p;
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('timeout');
    expect(j.needsApproval).toBe(true);
  });

  it('does not fall back before the timeout elapses', async () => {
    vi.useFakeTimers();
    const slow: TypeSafeCaller = () => new Promise((r) => setTimeout(() => r(response()), TYPESAFE_TIMEOUT_MS - 500));
    const p = judgeThread(makeThread(), { caller: slow });
    await vi.advanceTimersByTimeAsync(TYPESAFE_TIMEOUT_MS);
    const j = await p;
    expect(j.source).toBe('typesafe');
  });

  it('maps an SDK APITimeoutError to reason "timeout"', async () => {
    const sdkTimeout: TypeSafeCaller = async () => {
      throw Object.assign(new Error('Request timed out'), { name: 'APITimeoutError' });
    };
    const j = await judgeThread(makeThread(), { caller: sdkTimeout });
    expect(j.fallbackReason).toBe('timeout');
  });

  it('falls back on HTTP errors (401, 429, 500) without throwing', async () => {
    for (const status of [401, 429, 500]) {
      clearJudgmentCache();
      const j = await judgeThread(makeThread(), {
        caller: async () => {
          throw Object.assign(new Error('http'), { status });
        },
      });
      expect(j.source).toBe('heuristic');
      expect(j.fallbackReason).toBe(`error:${status}`);
    }
  });

  it('does not cache fallback results, so the next call retries TypeSafe', async () => {
    let calls = 0;
    const caller: TypeSafeCaller = async () => {
      calls++;
      if (calls === 1) throw new Error('network');
      return response();
    };
    const t = makeThread();
    expect((await judgeThread(t, { caller })).source).toBe('heuristic');
    expect((await judgeThread(t, { caller })).source).toBe('typesafe');
    expect(calls).toBe(2);
  });
});

describe('low confidence: needs review path', () => {
  it('uses the 0.70 review threshold and 0.40 fallback threshold', () => {
    expect(REVIEW_CONFIDENCE).toBe(0.7);
    expect(FALLBACK_CONFIDENCE).toBe(0.4);
  });

  it('keeps the Jev answer but flags needs review between 0.40 and 0.70', async () => {
    const j = await judgeThread(makeThread(), { caller: async () => response({ choiceConf: 0.55 }) });
    expect(j.source).toBe('typesafe');
    expect(j.confidence).toBe(0.55);
    expect(j.needsReview).toBe(true);
  });

  it('confidence is the minimum of the Choice and Score confidences', async () => {
    const j = await judgeThread(makeThread(), { caller: async () => response({ choiceConf: 0.95, scoreConf: 0.6 }) });
    expect(j.confidence).toBe(0.6);
    expect(j.needsReview).toBe(true);
  });

  it('does not flag review at exactly 0.70 with a decisive approval answer', async () => {
    const j = await judgeThread(makeThread(), { caller: async () => response({ choiceConf: 0.7, scoreConf: 0.7 }) });
    expect(j.source).toBe('typesafe');
    expect(j.needsReview).toBe(false);
  });

  it('flags review when the approval probability is indecisive (near 0.5)', async () => {
    const j = await judgeThread(makeThread(), { caller: async () => response({ noul: 0.55 }) });
    expect(j.source).toBe('typesafe');
    expect(j.needsReview).toBe(true);
  });

  it('below 0.40 uses the rules answer, flags review, and keeps the Jev answer for display', async () => {
    const j = await judgeThread(makeThread(), { caller: async () => response({ scoreConf: 0.3 }) });
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('low_confidence');
    expect(j.needsReview).toBe(true);
    expect(j.typesafe?.confidence).toBe(0.3);
  });

  it('summary counts needs-review judgments', async () => {
    const out = await judgeThreads(
      [makeThread({ id: 'x1' }), makeThread({ id: 'x2', subject: 'unsure' })],
      { caller: async ({ state }) => (state.email.subject === 'unsure' ? response({ choiceConf: 0.5 }) : response()) }
    );
    const s = summarize(out.values());
    expect(s.typesafe).toBe(2);
    expect(s.needsReview).toBe(1);
  });
});

describe('missing API key', () => {
  it('reports not configured for missing or blank keys', () => {
    delete process.env.TYPESAFE_API_KEY;
    expect(isTypeSafeConfigured()).toBe(false);
    process.env.TYPESAFE_API_KEY = '   ';
    expect(isTypeSafeConfigured()).toBe(false);
  });

  it('a blank key still falls back with reason no_api_key', async () => {
    process.env.TYPESAFE_API_KEY = '  ';
    const j = await judgeThread(makeThread());
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('no_api_key');
  });

  it('batch judging without a key returns rules for every thread and keyConfigured=false', async () => {
    delete process.env.TYPESAFE_API_KEY;
    const threads = [makeThread({ id: 'k1' }), makeThread({ id: 'k2' }), makeThread({ id: 'k3' })];
    const out = await judgeThreads(threads);
    expect(out.size).toBe(3);
    for (const j of out.values()) {
      expect(j.source).toBe('heuristic');
      expect(j.fallbackReason).toBe('no_api_key');
    }
    expect(summarize(out.values())).toMatchObject({ typesafe: 0, heuristic: 3, keyConfigured: false });
  });

  it('forced rules mode never calls TypeSafe', async () => {
    const caller = vi.fn(async () => response());
    const out = await judgeThreads([makeThread()], { caller, mode: 'heuristic' });
    expect(caller).not.toHaveBeenCalled();
    expect(out.get('rel-1')?.fallbackReason).toBe('forced_rules');
  });
});

describe('malformed TypeSafe responses', () => {
  const t = makeThread();
  const cases: [string, any][] = [
    ['null', null],
    ['undefined', undefined],
    ['empty object', {}],
    ['answers is a string', { answers: 'oops' }],
    ['missing needs_approval', { answers: { ...response().answers, needs_approval: undefined } }],
    ['noul as string', { answers: { ...response().answers, needs_approval: { noul: '0.9' } } }],
    ['missing choice', { answers: { ...response().answers, action_type: { confidence: 0.9 } } }],
    ['missing choice confidence', { answers: { ...response().answers, action_type: { choice: 'refund' } } }],
    ['score is null', { answers: { ...response().answers, urgency: { score: null, confidence: 0.9 } } }],
    ['missing score confidence', { answers: { ...response().answers, urgency: { score: 2 } } }],
  ];
  for (const [name, res] of cases) {
    it(`falls back with malformed_response: ${name}`, () => {
      const j = interpretTypeSafe(t, res, 10);
      expect(j.source).toBe('heuristic');
      expect(j.fallbackReason).toBe('malformed_response');
    });
  }

  it('does not cache malformed responses', async () => {
    let calls = 0;
    const caller: TypeSafeCaller = async () => {
      calls++;
      return calls === 1 ? { answers: null } : response();
    };
    expect((await judgeThread(t, { caller })).fallbackReason).toBe('malformed_response');
    expect((await judgeThread(t, { caller })).source).toBe('typesafe');
  });

  it('clamps out-of-range urgency scores to P3..P0', () => {
    expect(interpretTypeSafe(t, response({ score: 9 }), 1).urgency).toBe('P0');
    expect(interpretTypeSafe(t, response({ score: -4 }), 1).urgency).toBe('P3');
  });

  it('treats a non-JSON body (parse error) as a fallback, not a crash', async () => {
    const j = await judgeThread(t, {
      caller: async () => {
        throw new SyntaxError('Unexpected token < in JSON');
      },
    });
    expect(j.source).toBe('heuristic');
    expect(j.fallbackReason).toBe('error:SyntaxError');
  });
});
