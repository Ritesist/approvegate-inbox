import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsForThread } from '@/lib/store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const logs = getAuditLogsForThread(params.id);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
