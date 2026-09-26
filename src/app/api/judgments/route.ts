import { NextRequest, NextResponse } from 'next/server';
import { getAllThreads } from '@/lib/store';
import {
  clearJudgmentCache,
  judgeThreads,
  summarize,
  FALLBACK_CONFIDENCE,
  REVIEW_CONFIDENCE,
  TYPESAFE_MODEL,
} from '@/lib/typesafe';

export const dynamic = 'force-dynamic';

/**
 * Demo endpoint for the TypeSafe path.
 *   GET /api/judgments            -> judgments for all threads (cached Jev answers or rules)
 *   GET /api/judgments?judge=rules -> force the heuristic fallback
 *   GET /api/judgments?refresh=1  -> clear the in-memory cache first (re-calls TypeSafe)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    if (sp.get('refresh') === '1') clearJudgmentCache();
    const mode = sp.get('judge') === 'rules' || sp.get('judge') === 'heuristic' ? 'heuristic' : 'auto';
    const threads = getAllThreads();
    const started = Date.now();
    const judgments = await judgeThreads(threads, { mode });
    return NextResponse.json({
      model: TYPESAFE_MODEL,
      thresholds: { fallbackConfidence: FALLBACK_CONFIDENCE, reviewConfidence: REVIEW_CONFIDENCE },
      elapsedMs: Date.now() - started,
      summary: summarize(judgments.values()),
      judgments: threads.map((t) => ({ id: t.id, subject: t.subject, ...judgments.get(t.id) })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
