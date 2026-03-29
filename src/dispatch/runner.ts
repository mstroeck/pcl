import { ModelConfig } from '../config/schema.js';
import { AnthropicAdapter } from './anthropic.js';
import { OpenAIAdapter } from './openai.js';
import { GoogleAdapter } from './google.js';
import { ModelAdapter, PlanRequest, PlanResponse } from './adapter.js';

export async function dispatchToModels(
  models: ModelConfig[],
  request: PlanRequest
): Promise<PlanResponse[]> {
  const promises = models.map((modelConfig) => dispatchToModel(modelConfig, request));
  return Promise.all(promises);
}

async function dispatchToModel(
  modelConfig: ModelConfig,
  request: PlanRequest
): Promise<PlanResponse> {
  const adapter = createAdapter(modelConfig);

  const requestWithConfig: PlanRequest = {
    ...request,
    maxTokens: modelConfig.maxTokens || request.maxTokens,
    temperature: modelConfig.temperature ?? request.temperature,
    timeout: modelConfig.timeout || request.timeout,
  };

  return retryWithBackoff(() => adapter.execute(requestWithConfig), 3);
}

function createAdapter(modelConfig: ModelConfig): ModelAdapter {
  const apiKey = modelConfig.apiKey || getApiKeyFromEnv(modelConfig.provider);

  if (!apiKey) {
    throw new Error(`API key not found for provider: ${modelConfig.provider}`);
  }

  switch (modelConfig.provider) {
    case 'anthropic':
      return new AnthropicAdapter(apiKey, modelConfig.model);
    case 'openai':
      return new OpenAIAdapter(apiKey, modelConfig.model, modelConfig.baseURL);
    case 'google':
      return new GoogleAdapter(apiKey, modelConfig.model);
    case 'openai-compat':
      if (!modelConfig.baseURL) {
        throw new Error('baseURL is required for openai-compat provider');
      }
      return new OpenAIAdapter(apiKey, modelConfig.model, modelConfig.baseURL);
    default:
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
  }
}

function getApiKeyFromEnv(provider: string): string | undefined {
  switch (provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'openai':
    case 'openai-compat':
      return process.env.OPENAI_API_KEY;
    case 'google':
      return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    default:
      return undefined;
  }
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
