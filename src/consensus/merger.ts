import {
  ModelPlan,
  ConsensusStep,
  ConsensusDecision,
  ConsensusRisk,
  Severity,
} from './types.js';
import {
  groupSimilarSteps,
  groupSimilarDecisions,
  groupSimilarRisks,
  StepGroup,
  DecisionGroup,
  RiskGroup,
} from './deduper.js';

export function mergeSteps(modelPlans: ModelPlan[], threshold: number): ConsensusStep[] {
  const allSteps: Array<{ step: any; modelName: string }> = [];

  for (const plan of modelPlans) {
    for (const step of plan.steps) {
      allSteps.push({ step, modelName: plan.modelName });
    }
  }

  const groups = groupSimilarSteps(allSteps, threshold);

  return groups.map((group) => mergeStepGroup(group, modelPlans.length));
}

function mergeStepGroup(group: StepGroup, totalModels: number): ConsensusStep {
  const representative = group.steps[0].step;
  const proposedBy = group.steps.map((s) => s.modelName);
  const confidence = proposedBy.length / totalModels;

  const variations = group.steps.map((s) => ({
    modelName: s.modelName,
    description: s.step.description,
  }));

  // Merge dependencies (union of all)
  const allDependencies = new Set<string>();
  for (const item of group.steps) {
    for (const dep of item.step.dependencies) {
      allDependencies.add(dep);
    }
  }

  return {
    ...representative,
    confidence,
    proposedBy,
    variations,
    dependencies: Array.from(allDependencies),
  };
}

export function mergeDecisions(modelPlans: ModelPlan[], threshold: number): ConsensusDecision[] {
  const allDecisions: Array<{ decision: any; modelName: string }> = [];

  for (const plan of modelPlans) {
    for (const decision of plan.decisions) {
      allDecisions.push({ decision, modelName: plan.modelName });
    }
  }

  const groups = groupSimilarDecisions(allDecisions, threshold);

  return groups.map((group) => mergeDecisionGroup(group, modelPlans.length));
}

function mergeDecisionGroup(group: DecisionGroup, totalModels: number): ConsensusDecision {
  const representative = group.decisions[0].decision;
  const proposedBy = group.decisions.map((d) => d.modelName);
  const confidence = proposedBy.length / totalModels;

  const alternativesByModel: Record<string, string[]> = {};
  for (const item of group.decisions) {
    alternativesByModel[item.modelName] = item.decision.alternatives;
  }

  return {
    ...representative,
    confidence,
    proposedBy,
    alternativesByModel,
  };
}

export function mergeRisks(modelPlans: ModelPlan[], threshold: number): ConsensusRisk[] {
  const allRisks: Array<{ risk: any; modelName: string }> = [];

  for (const plan of modelPlans) {
    for (const risk of plan.risks) {
      allRisks.push({ risk, modelName: plan.modelName });
    }
  }

  const groups = groupSimilarRisks(allRisks, threshold);

  return groups.map((group) => mergeRiskGroup(group, modelPlans.length));
}

function mergeRiskGroup(group: RiskGroup, totalModels: number): ConsensusRisk {
  const representative = group.risks[0].risk;
  const proposedBy = group.risks.map((r) => r.modelName);
  const confidence = proposedBy.length / totalModels;

  const severityByModel: Record<string, Severity> = {};
  for (const item of group.risks) {
    severityByModel[item.modelName] = item.risk.severity;
  }

  // Elevate severity if multiple models flag it
  const maxSeverity = getMaxSeverity(Object.values(severityByModel));

  return {
    ...representative,
    severity: maxSeverity,
    confidence,
    proposedBy,
    severityByModel,
  };
}

function getMaxSeverity(severities: Severity[]): Severity {
  const order: Severity[] = ['low', 'medium', 'high', 'critical'];
  let max: Severity = 'low';

  for (const severity of severities) {
    if (order.indexOf(severity) > order.indexOf(max)) {
      max = severity;
    }
  }

  return max;
}

export function mergeSuggestedOrder(modelPlans: ModelPlan[]): string[] {
  // Simple approach: use the first model's order as base
  // Could be enhanced with voting/consensus later
  if (modelPlans.length === 0) return [];
  return modelPlans[0].suggestedOrder;
}
