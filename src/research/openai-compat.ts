import OpenAI from 'openai';
import { ResearchProvider, ResearchRequest, ResearchResponse } from './types.js';

export class OpenAICompatProvider implements ResearchProvider {
  private client: OpenAI;
  private model: string;
  private providerName: string;

  constructor(apiKey: string, baseURL: string, model: string, providerName: string = 'openai-compat') {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.model = model;
    this.providerName = providerName;
  }

  async execute(request: ResearchRequest): Promise<ResearchResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Provide comprehensive, accurate information about the requested topic.',
        },
        {
          role: 'user',
          content: request.query,
        },
      ],
      max_tokens: request.maxTokens || 4096,
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      citations: [],
      provider: this.providerName,
      model: this.model,
    };
  }
}
