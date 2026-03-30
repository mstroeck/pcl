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

export const ResearchConfigSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.string().default('perplexity'),
  model: z.string().optional(),
  maxTokens: z.number().default(4096),
  cacheTTL: z.number().default(3600),
  baseURL: z.string().optional(),
  apiKey: z.string().optional(),
});

export const ConsensusConfigSchema = z.object({
  similarity: z.enum(['jaccard', 'tfidf', 'hybrid']).default('hybrid'),
});

export const PluginConfigSchema = z.object({
  type: z.enum(['model', 'formatter', 'resolver', 'research']),
  name: z.string(),
  path: z.string(),
  options: z.record(z.unknown()).optional(),
});

export const PlanCouncilConfigSchema = z.object({
  models: z.array(ModelConfigSchema),
  depth: z.enum(['high-level', 'detailed', 'implementation']).default('detailed'),
  deduplicationThreshold: z.number().min(0).max(1).default(0.7),
  consensusThreshold: z.number().min(0).max(1).default(0.5),
  timeout: z.number().default(60000),
  maxCost: z.number().optional(),
  github: z.object({
    token: z.string().optional(),
  }).optional(),
  research: ResearchConfigSchema.optional(),
  consensus: ConsensusConfigSchema.optional(),
  plugins: z.array(PluginConfigSchema).optional(),
});

export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type ResearchConfig = z.infer<typeof ResearchConfigSchema>;
export type ConsensusConfig = z.infer<typeof ConsensusConfigSchema>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export type PlanCouncilConfig = z.infer<typeof PlanCouncilConfigSchema>;
