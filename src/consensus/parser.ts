import { ModelPlan, Step, Decision, Risk, Effort, STEP_CATEGORIES } from './types.js';
import { z } from 'zod';

// Zod schemas for validation
const StepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  effort: z.enum(['S', 'M', 'L', 'XL']).default('M'),
  risk: z.enum(['low', 'medium', 'high']).default('low'),
  dependencies: z.array(z.string()).default([]),
  category: z.enum(STEP_CATEGORIES).default('general'),
});

const DecisionSchema = z.object({
  question: z.string(),
  recommendation: z.string(),
  reasoning: z.string(),
  alternatives: z.array(z.string()).default([]),
});

const RiskSchema = z.object({
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  mitigation: z.string(),
});

const ModelPlanDataSchema = z.object({
  summary: z.string(),
  steps: z.array(StepSchema),
  decisions: z.array(DecisionSchema),
  risks: z.array(RiskSchema),
  estimatedTotalEffort: z.enum(['S', 'M', 'L', 'XL']).optional(),
  suggestedOrder: z.array(z.string()),
});

const MAX_JSON_SIZE = 10 * 1024 * 1024; // 10MB limit

export function parseModelPlan(modelName: string, jsonContent: string): ModelPlan {
  try {
    // Size check
    if (jsonContent.length > MAX_JSON_SIZE) {
      throw new Error(`JSON content exceeds size limit (${MAX_JSON_SIZE} bytes)`);
    }

    const parsed = JSON.parse(jsonContent);

    // Validate with Zod
    const validatedData = ModelPlanDataSchema.parse(parsed);

    return {
      modelName,
      summary: validatedData.summary,
      steps: validatedData.steps,
      decisions: validatedData.decisions,
      risks: validatedData.risks,
      estimatedTotalEffort: validatedData.estimatedTotalEffort,
      suggestedOrder: validatedData.suggestedOrder,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Failed to validate plan from ${modelName}: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw new Error(`Failed to parse plan from ${modelName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
