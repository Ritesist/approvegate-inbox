import { NextRequest, NextResponse } from 'next/server';
import { getLLMConfig, setLLMConfig } from '@/lib/ai/engine';

export async function GET() {
  try {
    const config = getLLMConfig();
    return NextResponse.json({
      config: {
        provider: config.provider,
        hasOpenAIKey: !!(config.openaiApiKey || process.env.OPENAI_API_KEY),
        hasGeminiKey: !!(config.geminiApiKey || process.env.GEMINI_API_KEY),
        openaiModel: config.openaiModel || 'gpt-4o-mini',
        geminiModel: config.geminiModel || 'gemini-1.5-flash',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = setLLMConfig({
      provider: body.provider,
      openaiApiKey: body.openaiApiKey,
      openaiModel: body.openaiModel,
      geminiApiKey: body.geminiApiKey,
      geminiModel: body.geminiModel,
    });
    return NextResponse.json({
      success: true,
      config: {
        provider: updated.provider,
        hasOpenAIKey: !!(updated.openaiApiKey || process.env.OPENAI_API_KEY),
        hasGeminiKey: !!(updated.geminiApiKey || process.env.GEMINI_API_KEY),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
