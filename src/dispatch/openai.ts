import OpenAI from 'openai';
import { ModelAdapter, PlanRequest, PlanResponse } from './adapter.js';
import { getModelCapabilities } from './capabilities.js';

export class OpenAIAdapter implements ModelAdapter {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }

  /**
   * Executes a plan request against the OpenAI API.
   *
   * IMPORTANT: This method throws on failure and should only be called via the
   * runner which implements retry logic for transient errors. Do not call directly.
   *
   * @throws {Error} On API errors, network failures, or invalid responses
   */
  async execute(request: PlanRequest): Promise<PlanResponse> {
    const capabilities = getModelCapabilities('openai', this.model);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: request.systemPrompt },
      { role: 'user', content: request.userPrompt },
    ];

    const params: OpenAI.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages,
      response_format: { type: 'json_object' },
    };

    // Add temperature only if supported (not for reasoning models)
    if (capabilities.supportsTemperature && request.temperature !== undefined) {
      params.temperature = request.temperature;
    }

    // Add max_tokens if specified
    if (request.maxTokens) {
      params.max_tokens = request.maxTokens;
    }

    const response = await this.client.chat.completions.create(params);

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      model: this.model,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens ?? 0,
            outputTokens: response.usage.completion_tokens ?? 0,
            totalTokens: response.usage.total_tokens ?? ((response.usage.prompt_tokens ?? 0) + (response.usage.completion_tokens ?? 0)),
          }
        : undefined,
    };
  }
}
