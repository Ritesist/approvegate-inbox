import { describe, it, expect } from 'vitest';
import { runMockTriage } from '../lib/ai/mock-engine';
import { TicketThread } from '../lib/types';

describe('Triage Intelligence Engine', () => {
  it('correctly triages critical production outage as P0 bug to Core Platform Engineering', () => {
    const thread: TicketThread = {
      id: 'test-outage',
      subject: 'URGENT: Production API throwing 500 errors across all US-East clusters',
      from: { name: 'DevOps Lead', email: 'dev@acme.com' },
      receivedAt: '2026-09-23T10:00:00Z',
      channel: 'email',
      customerTier: 'vip',
      tags: ['outage'],
      rawBody: 'Our checkout pipeline is failing right now. DB_POOL_EXHAUSTED. Losing $8000 per minute.',
      threadMessages: [],
      triage: null,
      draft: null,
      approvalStatus: 'pending',
      snoozedUntil: null,
      status: 'open',
      auditLog: [],
    };

    const { triage, draft } = runMockTriage(thread);

    expect(triage.priority).toBe('P0');
    expect(triage.category).toBe('bug');
    expect(triage.suggestedOwner).toBe('Core Platform Engineering');
    expect(triage.sentiment).toBe('urgent');
    expect(draft.tone).toBe('apologetic');
    expect(draft.suggestedActions.some((a) => a.title.includes('P0 On-Call'))).toBe(true);
  });

  it('correctly triages $4,200 unauthorized charge as P0 billing dispute', () => {
    const thread: TicketThread = {
      id: 'test-charge',
      subject: 'Unauthorized charge of $4,200 on corporate Amex - please refund immediately',
      from: { name: 'Elena', email: 'elena@fintech.io' },
      receivedAt: '2026-09-23T10:00:00Z',
      channel: 'email',
      customerTier: 'enterprise',
      tags: ['billing'],
      rawBody: 'Accounting flagged renewal of $4,200. We will file an immediate chargeback and initiate vendor termination.',
      threadMessages: [],
      triage: null,
      draft: null,
      approvalStatus: 'pending',
      snoozedUntil: null,
      status: 'open',
      auditLog: [],
    };

    const { triage, draft } = runMockTriage(thread);

    expect(triage.priority).toBe('P0');
    expect(triage.category).toBe('billing');
    expect(triage.suggestedOwner).toBe('Billing Ops');
    expect(draft.suggestedActions.some((a) => a.type === 'refund')).toBe(true);
  });

  it('correctly triages 500 seat RFP as P1 sales opportunity', () => {
    const thread: TicketThread = {
      id: 'test-rfp',
      subject: 'Enterprise Procurement RFP: 500 seat rollout requirement questions',
      from: { name: 'David', email: 'david@logistics.com' },
      receivedAt: '2026-09-23T10:00:00Z',
      channel: 'web',
      customerTier: 'enterprise',
      tags: ['rfp'],
      rawBody: 'Evaluating vendor for 500 seat rollout across North America. Standard vendor questionnaire attached.',
      threadMessages: [],
      triage: null,
      draft: null,
      approvalStatus: 'pending',
      snoozedUntil: null,
      status: 'open',
      auditLog: [],
    };

    const { triage } = runMockTriage(thread);

    expect(triage.priority).toBe('P1');
    expect(triage.category).toBe('sales');
    expect(triage.suggestedOwner).toBe('Enterprise Sales');
  });

  it('correctly triages out-of-office autoreply as P3 FYI with zero draft send requirement', () => {
    const thread: TicketThread = {
      id: 'test-ooo',
      subject: 'Automatic reply: Out of Office until Monday Oct 5',
      from: { name: 'Postmaster', email: 'mailer-daemon@example.com' },
      receivedAt: '2026-09-23T10:00:00Z',
      channel: 'email',
      customerTier: 'free',
      tags: ['fyi'],
      rawBody: 'I will be out of the office returning Oct 5. Mailer daemon automatic notice.',
      threadMessages: [],
      triage: null,
      draft: null,
      approvalStatus: 'pending',
      snoozedUntil: null,
      status: 'open',
      auditLog: [],
    };

    const { triage, draft } = runMockTriage(thread);

    expect(triage.priority).toBe('P3');
    expect(triage.category).toBe('FYI');
    expect(draft.body).toContain('No outgoing email required');
  });
});
