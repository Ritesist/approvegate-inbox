import { NextResponse } from 'next/server';
import { triageAllUntriaged } from '@/lib/store';

export async function POST() {
  try {
    const result = await triageAllUntriaged();
    return NextResponse.json({ success: true, triagedCount: result.count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
