import {
  ModelPlan,
  ConsensusStep,
  ConsensusDecision,
  ConsensusRisk,
  Severity,
  Step,
  Decision,
  Risk,
} from './types.js';
import {
  groupSimilarSteps,
  groupSimilarDecisions,
  groupSimilarRisks,
  StepGroup,
  DecisionGroup,
  RiskGroup,
} from './deduper.js';

export function mergeSteps(modelPlans: ModelPlan[], threshold: number, consensusThreshold: number): ConsensusStep[] {
  const allSteps: Array<{ step: Step; modelName: string }> = [];

  for (const plan of modelPlans) {
    for (const step of plan.steps) {
      allSteps.push({ step, modelName: plan.modelName });
    }
  }

  const groups = groupSimilarSteps(allSteps, threshold);
  const merged = groups.map((group) => mergeStepGroup(group, modelPlans.length));
  const filtered = merged.filter((step) => step.confidence >= consensusThreshold);

  // If threshold filters out all steps, fall back to keeping all steps (with warning comment)
  // This ensures we never return an empty plan when models did propose steps
  if (filtered.length === 0 && merged.length > 0) {
    return merged;
  }

  return filtered;
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

export function mergeDecisions(modelPlans: ModelPlan[], threshold: number, consensusThreshold: number): ConsensusDecision[] {
  const allDecisions: Array<{ decision: Decision; modelName: string }> = [];

  for (const plan of modelPlans) {
    for (const decision of plan.decisions) {
      allDecisions.push({ decision, modelName: plan.modelName });
    }
  }

  const groups = groupSimilarDecisions(allDecisions, threshold);
  const merged = groups.map((group) => mergeDecisionGroup(group, modelPlans.length));
  const filtered = merged.filter((decision) => decision.confidence >= consensusThreshold);

  // If threshold filters out all decisions, fall back to keeping all decisions
  if (filtered.length === 0 && merged.length > 0) {
    return merged;
  }

  return filtered;
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

export function mergeRisks(modelPlans: ModelPlan[], threshold: number, consensusThreshold: number): ConsensusRisk[] {
  const allRisks: Array<{ risk: Risk; modelName: string }> = [];

  for (const plan of modelPlans) {
    for (const risk of plan.risks) {
      allRisks.push({ risk, modelName: plan.modelName });
    }
  }

  const groups = groupSimilarRisks(allRisks, threshold);
  const merged = groups.map((group) => mergeRiskGroup(group, modelPlans.length));
  const filtered = merged.filter((risk) => risk.confidence >= consensusThreshold);

  // If threshold filters out all risks, fall back to keeping all risks
  if (filtered.length === 0 && merged.length > 0) {
    return merged;
  }

  return filtered;
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
  // LIMITATION: Currently uses only the first model's suggested order.
  // A more robust approach would involve voting or weighted consensus,
  // but this adds complexity for minimal benefit in most cases.
  // The first model is typically selected by the user as primary.
  if (modelPlans.length === 0) return [];
  return modelPlans[0].suggestedOrder;
}
