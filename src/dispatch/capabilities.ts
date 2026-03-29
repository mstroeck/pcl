export interface ModelCapabilities {
  supportsTemperature: boolean;
  supportsJSON: boolean;
  requiresMaxTokens: boolean;
  isReasoningModel: boolean;
  isThinkingModel: boolean;
}

export function getModelCapabilities(provider: string, model: string): ModelCapabilities {
  // Reasoning models (OpenAI o1/o3 series)
  if (provider === 'openai' && (model.startsWith('o1') || model.startsWith('o3'))) {
    return {
      supportsTemperature: false,
      supportsJSON: true,
      requiresMaxTokens: false,
      isReasoningModel: true,
      isThinkingModel: false,
    };
  }

  // Thinking models (Gemini 2.x thinking variants)
  if (provider === 'google' && model.includes('thinking')) {
    return {
      supportsTemperature: true,
      supportsJSON: true,
      requiresMaxTokens: false,
      isReasoningModel: false,
      isThinkingModel: true,
    };
  }

  // Anthropic models
  if (provider === 'anthropic') {
    return {
      supportsTemperature: true,
      supportsJSON: true,
      requiresMaxTokens: true,
      isReasoningModel: false,
      isThinkingModel: false,
    };
  }

  // Default capabilities (OpenAI, Google standard models)
  return {
    supportsTemperature: true,
    supportsJSON: true,
    requiresMaxTokens: false,
    isReasoningModel: false,
    isThinkingModel: false,
  };
}
