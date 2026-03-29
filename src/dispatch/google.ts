import { GoogleGenerativeAI } from '@google/generative-ai';
import { ModelAdapter, PlanRequest, PlanResponse } from './adapter.js';
import { getModelCapabilities } from './capabilities.js';

export class GoogleAdapter implements ModelAdapter {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  /**
   * Executes a plan request against the Google Gemini API.
   *
   * IMPORTANT: This method throws on failure and should only be called via the
   * runner which implements retry logic for transient errors. Do not call directly.
   *
   * @throws {Error} On API errors, network failures, or invalid responses
   */
  async execute(request: PlanRequest): Promise<PlanResponse> {
    const capabilities = getModelCapabilities('google', this.model);

    // Inline type matches @google/generative-ai SDK's GenerationConfig shape
    // (SDK does not export this type, so we define it inline)
    const generationConfig: { responseMimeType: string; temperature?: number; maxOutputTokens?: number } = {
      responseMimeType: 'application/json',
    };

    // Add temperature if supported
    if (capabilities.supportsTemperature && request.temperature !== undefined) {
      generationConfig.temperature = request.temperature;
    }

    // For thinking models, don't set maxOutputTokens (let them run)
    if (!capabilities.isThinkingModel && request.maxTokens) {
      generationConfig.maxOutputTokens = request.maxTokens;
    }

    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig,
    });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${request.systemPrompt}\n\n${request.userPrompt}`,
            },
          ],
        },
      ],
    });

    const response = result.response;
    const content = response.text();

    return {
      content,
      model: this.model,
      usage: response.usageMetadata
        ? {
            inputTokens: response.usageMetadata.promptTokenCount || 0,
            outputTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }
}
