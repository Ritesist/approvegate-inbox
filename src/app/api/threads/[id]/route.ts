import { NextRequest, NextResponse } from 'next/server';
import { getThreadById } from '@/lib/store';
import { judgeThread } from '@/lib/typesafe';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const thread = getThreadById(params.id);
    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }
    const judgment = await judgeThread(thread);
    return NextResponse.json({ thread: { ...thread, judgment } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
