import { NextResponse } from 'next/server';
import { resetToDemoFixture } from '@/lib/store';

export async function POST() {
  try {
    const result = resetToDemoFixture();
    return NextResponse.json({
      success: true,
      message: 'Inbox successfully reset to built-in demo fixtures (~36 messy support threads).',
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
