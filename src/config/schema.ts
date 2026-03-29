import { z } from 'zod';

export const ModelConfigSchema = z.object({
  provider: z.enum(['anthropic', 'openai', 'google', 'openai-compat']),
  model: z.string(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  timeout: z.number().optional(),
});

export const PlanCouncilConfigSchema = z.object({
  models: z.array(ModelConfigSchema),
  depth: z.enum(['high-level', 'detailed', 'implementation']).default('detailed'),
  consensusThreshold: z.number().min(0).max(1).default(0.5),
  deduplicationThreshold: z.number().min(0).max(1).default(0.7),
  timeout: z.number().default(60000),
  maxCost: z.number().optional(),
  github: z.object({
    token: z.string().optional(),
  }).optional(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type PlanCouncilConfig = z.infer<typeof PlanCouncilConfigSchema>;
