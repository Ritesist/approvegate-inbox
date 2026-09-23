import { TicketThread, TriageData, DraftReplyData, LLMConfig } from '../types';
import { runMockTriage } from './mock-engine';
import { runOpenAITriage } from './openai-engine';
import { runGeminiTriage } from './gemini-engine';

let globalConfig: LLMConfig = {
  provider: 'mock',
};

export function getLLMConfig(): LLMConfig {
  return { ...globalConfig };
}

export function setLLMConfig(config: Partial<LLMConfig>): LLMConfig {
  globalConfig = { ...globalConfig, ...config };
  return globalConfig;
}

export async function triageThread(
  thread: TicketThread,
  configOverride?: LLMConfig
): Promise<{ triage: TriageData; draft: DraftReplyData }> {
  const config = configOverride || globalConfig;

  if (config.provider === 'openai' && (config.openaiApiKey || process.env.OPENAI_API_KEY)) {
    return runOpenAITriage(thread, config.openaiApiKey, config.openaiModel);
  }

  if (config.provider === 'gemini' && (config.geminiApiKey || process.env.GEMINI_API_KEY)) {
    return runGeminiTriage(thread, config.geminiApiKey, config.geminiModel);
  }

  // Default to mock engine (fast, offline, deterministic, zero-key)
  return runMockTriage(thread);
}
