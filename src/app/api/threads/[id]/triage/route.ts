import { NextRequest, NextResponse } from 'next/server';
import { triageThreadInStore } from '@/lib/store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await triageThreadInStore(params.id);
    return NextResponse.json({ thread: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
