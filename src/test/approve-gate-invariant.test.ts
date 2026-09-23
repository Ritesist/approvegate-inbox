import { describe, it, expect, beforeEach } from 'vitest';
import {
  resetToDemoFixture,
  triageThreadInStore,
  approveDraft,
  editDraft,
  rejectDraft,
  snoozeDraft,
  sendApprovedReply,
  getThreadById,
  ApproveGateInvariantViolationError,
} from '../lib/store';

describe('ApproveGate Hard Invariant Verification: Zero Auto-Send Guarantee', () => {
  beforeEach(() => {
    resetToDemoFixture();
  });

  it('INVARIANT 1: Throws error and blocks send when thread is in pending approval state', async () => {
    const threadId = 'thread-001';
    await triageThreadInStore(threadId);

    const thread = getThreadById(threadId);
    expect(thread?.approvalStatus).toBe('pending');

    expect(() => {
      sendApprovedReply(threadId);
    }).toThrow(ApproveGateInvariantViolationError);

    const afterAttempt = getThreadById(threadId);
    expect(afterAttempt?.approvalStatus).toBe('pending');
    expect(afterAttempt?.auditLog.some((a) => a.action === 'send_blocked')).toBe(true);
  });

  it('INVARIANT 2: Blocks send when thread is rejected', async () => {
    const threadId = 'thread-002';
    await triageThreadInStore(threadId);
    rejectDraft(threadId, 'Customer stated they contacted wrong department');

    const thread = getThreadById(threadId);
    expect(thread?.approvalStatus).toBe('rejected');

    expect(() => {
      sendApprovedReply(threadId);
    }).toThrow(ApproveGateInvariantViolationError);
  });

  it('INVARIANT 3: Blocks send when thread is snoozed', async () => {
    const threadId = 'thread-003';
    await triageThreadInStore(threadId);
    snoozeDraft(threadId, 24, 'Awaiting customer reply');

    const thread = getThreadById(threadId);
    expect(thread?.approvalStatus).toBe('snoozed');

    expect(() => {
      sendApprovedReply(threadId);
    }).toThrow(ApproveGateInvariantViolationError);
  });

  it('INVARIANT 4: Successfully dispatches reply ONLY after explicit operator approval', async () => {
    const threadId = 'thread-006';
    await triageThreadInStore(threadId);

    // Operator explicitly approves
    approveDraft(threadId, 'Approved for customer release');
    const approvedThread = getThreadById(threadId);
    expect(approvedThread?.approvalStatus).toBe('approved');

    // Send now succeeds
    const result = sendApprovedReply(threadId);
    expect(result.success).toBe(true);
    expect(result.thread.approvalStatus).toBe('sent');
    expect(result.thread.status).toBe('resolved');
    expect(result.thread.sentAt).toBeDefined();

    // Audit log records full trail
    const auditActions = result.thread.auditLog.map((a) => a.action);
    expect(auditActions).toContain('draft_approved');
    expect(auditActions).toContain('reply_sent');
  });

  it('INVARIANT 5: Editing an approved draft revokes approval and reverts status to pending', async () => {
    const threadId = 'thread-007';
    await triageThreadInStore(threadId);

    approveDraft(threadId);
    expect(getThreadById(threadId)?.approvalStatus).toBe('approved');

    // Operator edits content
    editDraft(threadId, 'Updated custom response text with corrected invoice terms.');
    const editedThread = getThreadById(threadId);

    // Approval MUST be revoked for safety
    expect(editedThread?.approvalStatus).toBe('pending');

    // Attempting to send without re-approval MUST fail
    expect(() => {
      sendApprovedReply(threadId);
    }).toThrow(ApproveGateInvariantViolationError);
  });
});
