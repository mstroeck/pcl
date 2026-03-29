import Anthropic from '@anthropic-ai/sdk';
import { ModelAdapter, PlanRequest, PlanResponse } from './adapter.js';

export class AnthropicAdapter implements ModelAdapter {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async execute(request: PlanRequest): Promise<PlanResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: request.maxTokens || 32768,
        temperature: request.temperature,
        system: request.systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.userPrompt,
          },
        ],
        tools: [
          {
            name: 'create_plan',
            description: 'Create a structured plan in JSON format',
            input_schema: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      effort: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
                      risk: { type: 'string', enum: ['low', 'medium', 'high'] },
                      dependencies: { type: 'array', items: { type: 'string' } },
                      category: {
                        type: 'string',
                        enum: ['architecture', 'implementation', 'testing', 'infrastructure', 'design', 'research'],
                      },
                    },
                    required: ['id', 'title', 'description', 'effort', 'risk', 'dependencies', 'category'],
                  },
                },
                decisions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      recommendation: { type: 'string' },
                      reasoning: { type: 'string' },
                      alternatives: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['question', 'recommendation', 'reasoning', 'alternatives'],
                  },
                },
                risks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      description: { type: 'string' },
                      severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                      mitigation: { type: 'string' },
                    },
                    required: ['description', 'severity', 'mitigation'],
                  },
                },
                estimatedTotalEffort: { type: 'string', enum: ['S', 'M', 'L', 'XL'] },
                suggestedOrder: { type: 'array', items: { type: 'string' } },
              },
              required: ['summary', 'steps', 'decisions', 'risks', 'suggestedOrder'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'create_plan' },
      });

      const toolUse = response.content.find((c) => c.type === 'tool_use') as Anthropic.ToolUseBlock | undefined;

      if (!toolUse) {
        throw new Error('No tool use block found in response');
      }

      return {
        content: JSON.stringify(toolUse.input),
        model: this.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      };
    } catch (error) {
      return {
        content: '',
        model: this.model,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
