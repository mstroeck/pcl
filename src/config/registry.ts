/**
 * Centralized model registry - single source of truth for model metadata
 */

export interface ModelMetadata {
  provider: 'anthropic' | 'openai' | 'google';
  aliases: string[];
  pricing: { input: number; output: number }; // per 1M tokens
  capabilities: {
    maxTokens: number;
    supportsThinking?: boolean; // Gemini thinking models
    supportsReasoning?: boolean; // OpenAI o1/o3
    skipTemperature?: boolean; // o1/o3 don't support temperature
  };
  defaults: {
    maxTokens: number;
    temperature?: number;
  };
}

export const MODEL_REGISTRY: Record<string, ModelMetadata> = {
  // Anthropic Claude models
  'claude-opus-4-6': {
    provider: 'anthropic',
    aliases: ['opus'],
    pricing: { input: 15, output: 75 },
    capabilities: { maxTokens: 200000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'claude-opus-4': {
    provider: 'anthropic',
    aliases: [],
    pricing: { input: 15, output: 75 },
    capabilities: { maxTokens: 200000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'claude-sonnet-4-5-20250929': {
    provider: 'anthropic',
    aliases: ['sonnet'],
    pricing: { input: 3, output: 15 },
    capabilities: { maxTokens: 200000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'claude-sonnet-4': {
    provider: 'anthropic',
    aliases: [],
    pricing: { input: 3, output: 15 },
    capabilities: { maxTokens: 200000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'claude-haiku-4-5-20251001': {
    provider: 'anthropic',
    aliases: ['haiku'],
    pricing: { input: 1, output: 5 },
    capabilities: { maxTokens: 200000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'claude-haiku-4': {
    provider: 'anthropic',
    aliases: [],
    pricing: { input: 1, output: 5 },
    capabilities: { maxTokens: 200000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },

  // OpenAI models
  'gpt-5': {
    provider: 'openai',
    aliases: [],
    pricing: { input: 10, output: 30 },
    capabilities: { maxTokens: 128000 },
    defaults: { maxTokens: 4096, temperature: 1.0 },
  },
  'gpt-5.4': {
    provider: 'openai',
    aliases: [],
    pricing: { input: 10, output: 30 },
    capabilities: { maxTokens: 128000 },
    defaults: { maxTokens: 4096, temperature: 1.0 },
  },
  'gpt-4-turbo': {
    provider: 'openai',
    aliases: [],
    pricing: { input: 10, output: 30 },
    capabilities: { maxTokens: 128000 },
    defaults: { maxTokens: 4096, temperature: 1.0 },
  },
  'gpt-4o': {
    provider: 'openai',
    aliases: [],
    pricing: { input: 5, output: 15 },
    capabilities: { maxTokens: 128000 },
    defaults: { maxTokens: 4096, temperature: 1.0 },
  },
  'o1': {
    provider: 'openai',
    aliases: [],
    pricing: { input: 15, output: 60 },
    capabilities: {
      maxTokens: 100000,
      supportsReasoning: true,
      skipTemperature: true,
    },
    defaults: { maxTokens: 32768 }, // No temperature for o1
  },
  'o3': {
    provider: 'openai',
    aliases: [],
    pricing: { input: 15, output: 60 },
    capabilities: {
      maxTokens: 100000,
      supportsReasoning: true,
      skipTemperature: true,
    },
    defaults: { maxTokens: 32768 },
  },

  // Google Gemini models
  'gemini-2.5-pro': {
    provider: 'google',
    aliases: [],
    pricing: { input: 2.5, output: 10 },
    capabilities: { maxTokens: 1000000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'gemini-2.5-flash': {
    provider: 'google',
    aliases: [],
    pricing: { input: 0.5, output: 2 },
    capabilities: { maxTokens: 1000000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'gemini-2.0-flash': {
    provider: 'google',
    aliases: [],
    pricing: { input: 0.3, output: 1.2 },
    capabilities: { maxTokens: 1000000 },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
  'gemini-2.0-flash-thinking': {
    provider: 'google',
    aliases: [],
    pricing: { input: 0.3, output: 1.2 },
    capabilities: {
      maxTokens: 1000000,
      supportsThinking: true,
    },
    defaults: { maxTokens: 8192, temperature: 1.0 },
  },
};

// Get model metadata
export function getModelMetadata(model: string): ModelMetadata | undefined {
  return MODEL_REGISTRY[model];
}

// Resolve alias to full model name
export function resolveAlias(alias: string): string | undefined {
  for (const [modelName, metadata] of Object.entries(MODEL_REGISTRY)) {
    if (metadata.aliases.includes(alias)) {
      return modelName;
    }
  }
  return undefined;
}

// Get cheapest model for synthesis
export function getCheapestModel(models: string[]): string | undefined {
  let cheapest: string | undefined;
  let lowestCost = Infinity;

  for (const model of models) {
    const metadata = getModelMetadata(model);
    if (metadata) {
      const avgCost = (metadata.pricing.input + metadata.pricing.output) / 2;
      if (avgCost < lowestCost) {
        lowestCost = avgCost;
        cheapest = model;
      }
    }
  }

  return cheapest;
}
