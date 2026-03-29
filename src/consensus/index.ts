import { PlanResponse } from '../dispatch/adapter.js';
import { ConsensusPlan, ModelPlan } from './types.js';
import { parseModelPlan } from './parser.js';
import { mergeSteps, mergeDecisions, mergeRisks, mergeSuggestedOrder } from './merger.js';
import { identifyDisagreements } from './disagreements.js';

export interface ConsensusOptions {
  deduplicationThreshold: number;
}

export function buildConsensus(
  responses: PlanResponse[],
  options: ConsensusOptions
): ConsensusPlan {
  // Parse all model plans
  const modelPlans: ModelPlan[] = [];
  const errors: Array<{ model: string; error: string }> = [];

  for (const response of responses) {
    if (response.error) {
      errors.push({ model: response.model, error: response.error });
      continue;
    }

    try {
      const plan = parseModelPlan(response.model, response.content);
      modelPlans.push(plan);
    } catch (error) {
      errors.push({
        model: response.model,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (modelPlans.length === 0) {
    throw new Error(
      `No valid plans received. Errors: ${errors.map((e) => `${e.model}: ${e.error}`).join('; ')}`
    );
  }

  // Merge steps, decisions, risks
  const steps = mergeSteps(modelPlans, options.deduplicationThreshold);
  const decisions = mergeDecisions(modelPlans, options.deduplicationThreshold);
  const risks = mergeRisks(modelPlans, options.deduplicationThreshold);

  // Identify disagreements
  const disagreements = identifyDisagreements(modelPlans, decisions);

  // Merge suggested order
  const suggestedOrder = mergeSuggestedOrder(modelPlans);

  // Generate summary
  const summary = generateSummary(modelPlans);

  return {
    summary,
    steps,
    decisions,
    risks,
    disagreements,
    suggestedOrder,
    modelPlans,
  };
}

function generateSummary(modelPlans: ModelPlan[]): string {
  if (modelPlans.length === 1) {
    return modelPlans[0].summary;
  }

  return `Consensus plan from ${modelPlans.length} models: ${modelPlans.map((p) => p.modelName).join(', ')}`;
}

export * from './types.js';
