import { NextResponse } from 'next/server';
import { runEvaluation } from '@/lib/eval';

export async function GET() {
  try {
    const metrics = await runEvaluation();
    return NextResponse.json({ metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const metrics = await runEvaluation();
    return NextResponse.json({ metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
