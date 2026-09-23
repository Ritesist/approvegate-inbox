import { NextRequest, NextResponse } from 'next/server';
import {
  approveDraft,
  editDraft,
  rejectDraft,
  snoozeDraft,
  sendApprovedReply,
  toggleActionItem,
  ApproveGateInvariantViolationError,
} from '@/lib/store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'approve': {
        const thread = approveDraft(params.id, body.note);
        return NextResponse.json({ success: true, thread });
      }

      case 'edit': {
        if (!body.body) {
          return NextResponse.json({ error: 'Body content is required for edit' }, { status: 400 });
        }
        const thread = editDraft(params.id, body.body, body.suggestedActions, body.note);
        return NextResponse.json({ success: true, thread });
      }

      case 'reject': {
        const thread = rejectDraft(params.id, body.reason || 'Rejected by operator');
        return NextResponse.json({ success: true, thread });
      }

      case 'snooze': {
        const hours = Number(body.hours) || 24;
        const thread = snoozeDraft(params.id, hours, body.reason);
        return NextResponse.json({ success: true, thread });
      }

      case 'toggle_action': {
        if (!body.actionId) {
          return NextResponse.json({ error: 'actionId is required' }, { status: 400 });
        }
        const thread = toggleActionItem(params.id, body.actionId);
        return NextResponse.json({ success: true, thread });
      }

      case 'send': {
        // Enforces hard human-approve gate
        try {
          const result = sendApprovedReply(params.id);
          return NextResponse.json({ success: true, thread: result.thread });
        } catch (err: any) {
          if (err instanceof ApproveGateInvariantViolationError) {
            return NextResponse.json(
              {
                error: 'INVARIANT_VIOLATION',
                message: err.message,
                hardGateEnforced: true,
              },
              { status: 403 }
            );
          }
          throw err;
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
