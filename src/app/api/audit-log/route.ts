import { NextResponse } from 'next/server';
import { getAllAuditLogs } from '@/lib/store';

export async function GET() {
  try {
    const logs = getAllAuditLogs();
    return NextResponse.json({ total: logs.length, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
