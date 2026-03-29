import { PerplexityProvider } from './perplexity.js';
import { OpenAICompatProvider } from './openai-compat.js';
import { ResearchProvider, ResearchRequest, ResearchResponse } from './types.js';

export interface ResearchConfig {
  enabled: boolean;
  provider: string;
  model?: string;
  maxTokens?: number;
  cacheTTL?: number;
  baseURL?: string;
  apiKey?: string;
}

export async function conductResearch(
  taskDescription: string,
  config: ResearchConfig
): Promise<ResearchResponse | null> {
  if (!config.enabled) {
    return null;
  }

  const query = synthesizeResearchQuery(taskDescription);
  const provider = createResearchProvider(config);

  const request: ResearchRequest = {
    query,
    maxTokens: config.maxTokens || 4096,
  };

  return provider.execute(request);
}

function synthesizeResearchQuery(taskDescription: string): string {
  // Extract key topics and questions from the task description
  // This creates a focused research query
  const lines = taskDescription.split('\n').filter((l) => l.trim());
  const firstParagraph = lines.slice(0, 3).join(' ');

  return `Research the following software development task and provide relevant context, best practices, and considerations:\n\n${firstParagraph}\n\nProvide comprehensive information about:\n1. Relevant technologies and frameworks\n2. Best practices and design patterns\n3. Common pitfalls and how to avoid them\n4. Security considerations\n5. Performance optimization tips`;
}

function createResearchProvider(config: ResearchConfig): ResearchProvider {
  const apiKey = config.apiKey || getApiKeyFromEnv(config.provider);

  if (!apiKey) {
    throw new Error(`API key not found for research provider: ${config.provider}`);
  }

  switch (config.provider) {
    case 'perplexity':
      return new PerplexityProvider(
        apiKey,
        config.model || 'sonar-deep-research'
      );

    case 'openai-compat':
      if (!config.baseURL) {
        throw new Error('baseURL is required for openai-compat research provider');
      }
      if (!config.model) {
        throw new Error('model is required for openai-compat research provider');
      }
      return new OpenAICompatProvider(
        apiKey,
        config.baseURL,
        config.model,
        'openai-compat'
      );

    default:
      throw new Error(`Unsupported research provider: ${config.provider}`);
  }
}

function getApiKeyFromEnv(provider: string): string | undefined {
  switch (provider) {
    case 'perplexity':
      return process.env.PERPLEXITY_API_KEY;
    case 'openai-compat':
      return process.env.OPENAI_API_KEY;
    default:
      return undefined;
  }
}

export function formatResearchForPrompt(research: ResearchResponse): string {
  let formatted = '<domain-research>\n';
  formatted += `Provider: ${research.provider} (${research.model})\n\n`;
  formatted += research.content;

  if (research.citations && research.citations.length > 0) {
    formatted += '\n\nCitations:\n';
    for (const citation of research.citations) {
      formatted += `- ${citation}\n`;
    }
  }

  formatted += '</domain-research>';

  return formatted;
}

export * from './types.js';
