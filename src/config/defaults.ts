import { ModelConfig } from './schema.js';

export function getDefaultModels(): ModelConfig[] {
  const models: ModelConfig[] = [];

  // Auto-detect Anthropic (Opus 4.6)
  if (process.env.ANTHROPIC_API_KEY) {
    models.push({
      provider: 'anthropic',
      model: 'claude-opus-4-6',
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxTokens: 32768, // Anthropic requires max_tokens
    });
  }

  // Auto-detect OpenAI (GPT-5.4)
  if (process.env.OPENAI_API_KEY) {
    models.push({
      provider: 'openai',
      model: 'gpt-5.4',
      apiKey: process.env.OPENAI_API_KEY,
      // No maxTokens cap - let it run
    });
  }

  // Auto-detect Google (Gemini 2.5 Pro)
  if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
    models.push({
      provider: 'google',
      model: 'gemini-2.5-pro',
      apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
      // No maxOutputTokens for thinking models
    });
  }

  return models;
}

export const MODEL_ALIASES: Record<string, { provider: string; model: string }> = {
  'opus': { provider: 'anthropic', model: 'claude-opus-4-6' },
  'opus-4': { provider: 'anthropic', model: 'claude-opus-4' },
  'opus-4-6': { provider: 'anthropic', model: 'claude-opus-4-6' },
  'sonnet': { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  'sonnet-4': { provider: 'anthropic', model: 'claude-sonnet-4' },
  'sonnet-4-5': { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  'haiku': { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  'haiku-4': { provider: 'anthropic', model: 'claude-haiku-4' },
  'haiku-4-5': { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },

  'gpt-5': { provider: 'openai', model: 'gpt-5' },
  'gpt-5.4': { provider: 'openai', model: 'gpt-5.4' },
  'gpt-4': { provider: 'openai', model: 'gpt-4-turbo' },
  'gpt-4o': { provider: 'openai', model: 'gpt-4o' },
  'o1': { provider: 'openai', model: 'o1' },
  'o3': { provider: 'openai', model: 'o3' },

  'gemini': { provider: 'google', model: 'gemini-2.5-pro' },
  'gemini-2': { provider: 'google', model: 'gemini-2.0-flash' },
  'gemini-2.5': { provider: 'google', model: 'gemini-2.5-pro' },
  'gemini-2.5-pro': { provider: 'google', model: 'gemini-2.5-pro' },
  'gemini-2.5-flash': { provider: 'google', model: 'gemini-2.5-flash' },
};
