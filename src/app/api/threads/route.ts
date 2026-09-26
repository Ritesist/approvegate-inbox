import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads, importTickets, resetToDemoFixture } from '@/lib/store';
import { Priority, Category, ApprovalStatus } from '@/lib/types';
import { judgeThreads, summarize } from '@/lib/typesafe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.toLowerCase() || '';
    const priority = searchParams.get('priority') as Priority | null;
    const category = searchParams.get('category') as Category | null;
    const approvalStatus = searchParams.get('approvalStatus') as ApprovalStatus | null;
    const tier = searchParams.get('tier');

    let threads = getAllThreads();

    if (search) {
      threads = threads.filter(
        (t) =>
          t.subject.toLowerCase().includes(search) ||
          t.from.name.toLowerCase().includes(search) ||
          t.from.email.toLowerCase().includes(search) ||
          t.rawBody.toLowerCase().includes(search) ||
          t.triage?.summary.toLowerCase().includes(search)
      );
    }

    if (priority && priority !== ('all' as any)) {
      threads = threads.filter((t) => t.triage?.priority === priority);
    }

    if (category && category !== ('all' as any)) {
      threads = threads.filter((t) => t.triage?.category === category);
    }

    if (approvalStatus && approvalStatus !== ('all' as any)) {
      threads = threads.filter((t) => t.approvalStatus === approvalStatus);
    }

    if (tier && tier !== 'all') {
      threads = threads.filter((t) => t.customerTier === tier);
    }

    // Sort by priority (P0 first) or receivedAt desc
    const priorityWeight: Record<Priority, number> = { P0: 4, P1: 3, P2: 2, P3: 1 };
    threads.sort((a, b) => {
      const pA = a.triage ? priorityWeight[a.triage.priority] : 0;
      const pB = b.triage ? priorityWeight[b.triage.priority] : 0;
      if (pA !== pB) return pB - pA;
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });

    // Typed judgments: TypeSafe Jev when configured (cached in memory), rules otherwise.
    // ?judge=rules forces the heuristic path; default is auto.
    const judgeParam = searchParams.get('judge');
    const mode = judgeParam === 'rules' || judgeParam === 'heuristic' ? 'heuristic' : 'auto';
    const judgments = await judgeThreads(threads, { mode });
    const withJudgments = threads.map((t) => ({ ...t, judgment: judgments.get(t.id) }));

    return NextResponse.json({
      total: withJudgments.length,
      threads: withJudgments,
      judgmentSummary: summarize(judgments.values()),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'reset') {
      const result = resetToDemoFixture();
      return NextResponse.json({ message: 'Reset to demo fixture successful', ...result });
    }

    if (body.threads && Array.isArray(body.threads)) {
      const result = importTickets(body.threads);
      return NextResponse.json({ message: 'Import successful', ...result });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
