import OpenAI from 'openai';
import { ResearchProvider, ResearchRequest, ResearchResponse } from './types.js';

export class PerplexityProvider implements ResearchProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'sonar-deep-research') {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.perplexity.ai',
    });
    this.model = model;
  }

  async execute(request: ResearchRequest): Promise<ResearchResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant. Provide comprehensive, accurate information with citations when possible.',
        },
        {
          role: 'user',
          content: request.query,
        },
      ],
      max_tokens: request.maxTokens || 4096,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract citations if present (Perplexity includes them in the response)
    const citations = this.extractCitations(content);

    return {
      content,
      citations,
      provider: 'perplexity',
      model: this.model,
    };
  }

  private extractCitations(content: string): string[] {
    // Extract URLs from markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const citations: Set<string> = new Set();

    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      if (match[2].startsWith('http')) {
        citations.add(match[2]);
      }
    }

    return Array.from(citations);
  }
}
