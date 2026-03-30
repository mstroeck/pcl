import { ModelConfig } from '../config/schema.js';
import { AnthropicAdapter } from './anthropic.js';
import { OpenAIAdapter } from './openai.js';
import { GoogleAdapter } from './google.js';
import { ModelAdapter, PlanRequest, PlanResponse } from './adapter.js';
import { generateCacheKey, getFromCache, setInCache } from '../cache/index.js';

export async function dispatchToModels(
  models: ModelConfig[],
  request: PlanRequest,
  options?: { useCache?: boolean; cacheTTL?: number }
): Promise<PlanResponse[]> {
  const promises = models.map((modelConfig) =>
    dispatchToModel(modelConfig, request, options)
  );
  const results = await Promise.allSettled(promises);

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      // Convert rejected promise to error response (include provider for clarity)
      const provider = models[index].provider;
      const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      return {
        content: '',
        model: models[index].model,
        error: `[${provider}] ${errorMsg}`,
      };
    }
  });
}

async function dispatchToModel(
  modelConfig: ModelConfig,
  request: PlanRequest,
  options?: { useCache?: boolean; cacheTTL?: number }
): Promise<PlanResponse> {
  const useCache = options?.useCache ?? true;
  const cacheTTL = options?.cacheTTL ?? 3600; // 1 hour default

  // Generate cache key from request + model config (including provider)
  const cacheKey = generateCacheKey(
    request.systemPrompt,
    request.userPrompt,
    modelConfig.provider,
    modelConfig.model,
    JSON.stringify({
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
    })
  );

  // Try cache first
  if (useCache) {
    const cached = await getFromCache<PlanResponse>(cacheKey, cacheTTL);
    if (cached) {
      return { ...cached, cached: true };
    }
  }

  // Cache miss - execute request
  const adapter = createAdapter(modelConfig);

  const requestWithConfig: PlanRequest = {
    ...request,
    maxTokens: modelConfig.maxTokens || request.maxTokens,
    temperature: modelConfig.temperature ?? request.temperature,
    timeout: modelConfig.timeout || request.timeout,
  };

  const response = await retryWithBackoff(() => adapter.execute(requestWithConfig), 3);

  // Cache the response
  if (useCache) {
    await setInCache(cacheKey, response, cacheTTL);
  }

  return response;
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

function isTransientError(error: Error): boolean {
  // Check if error has a status property (SDK error objects)
  const errorWithStatus = error as Error & { status?: number };

  if (errorWithStatus.status !== undefined) {
    const status = errorWithStatus.status;
    // Retry on rate limits and server errors
    if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
      return true;
    }
    // Don't retry on client errors
    if (status === 401 || status === 403 || status === 404) {
      return false;
    }
  }

  // Fall back to string matching if no status property
  const message = error.message.toLowerCase();

  // Retry on rate limits and server errors (use word boundaries to avoid false positives)
  if (/\b429\b/.test(message) || message.includes('rate limit')) return true;
  if (/\b500\b/.test(message) || message.includes('internal server error')) return true;
  if (/\b502\b/.test(message) || message.includes('bad gateway')) return true;
  if (/\b503\b/.test(message) || message.includes('service unavailable')) return true;
  if (/\b504\b/.test(message) || message.includes('gateway timeout')) return true;
  if (message.includes('timeout')) return true;

  // Retry on common transient network errors
  if (message.includes('econnreset')) return true;
  if (message.includes('econnrefused')) return true;
  if (message.includes('etimedout')) return true;
  if (message.includes('enotfound')) return true;
  if (message.includes('eai_again')) return true;

  // Don't retry on authentication or not found errors (use word boundaries)
  if (/\b401\b/.test(message) || message.includes('unauthorized')) return false;
  if (/\b403\b/.test(message) || message.includes('forbidden')) return false;
  if (/\b404\b/.test(message) || message.includes('not found')) return false;

  return false;
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

      // Only retry transient errors
      if (!isTransientError(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
