import { ModelPlan, Disagreement, ConsensusDecision } from './types.js';

export function identifyDisagreements(
  modelPlans: ModelPlan[],
  consensusDecisions: ConsensusDecision[]
): Disagreement[] {
  const disagreements: Disagreement[] = [];

  // Find decisions where models recommend different approaches
  for (const decision of consensusDecisions) {
    const recommendations = new Set<string>();
    const positions: Array<{ modelName: string; stance: string }> = [];

    for (const modelName of decision.proposedBy) {
      const plan = modelPlans.find((p) => p.modelName === modelName);
      if (!plan) continue;

      const originalDecision = plan.decisions.find((d) => d.question === decision.question);
      if (!originalDecision) continue;

      recommendations.add(originalDecision.recommendation);
      positions.push({
        modelName,
        stance: originalDecision.recommendation,
      });
    }

    // If models recommend different things, it's a disagreement
    if (recommendations.size > 1) {
      disagreements.push({
        topic: decision.question,
        description: `Models disagree on: ${decision.question}`,
        positions,
      });
    }
  }

  // Identify steps that are unique to specific models (major divergences)
  const stepsByCategory = new Map<string, Set<string>>();

  for (const plan of modelPlans) {
    for (const step of plan.steps) {
      if (!stepsByCategory.has(step.category)) {
        stepsByCategory.set(step.category, new Set());
      }
      stepsByCategory.get(step.category)!.add(plan.modelName);
    }
  }

  // If some models have a category that others don't, it's a potential disagreement
  for (const [category, models] of stepsByCategory.entries()) {
    if (models.size > 0 && models.size < modelPlans.length) {
      disagreements.push({
        topic: `Approach to ${category}`,
        description: `Some models include ${category} steps while others don't`,
        positions: modelPlans.map((p) => ({
          modelName: p.modelName,
          stance: models.has(p.modelName) ? `Includes ${category}` : `Omits ${category}`,
        })),
      });
    }
  }

  return disagreements;
}
