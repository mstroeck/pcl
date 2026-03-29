/**
 * Weighted consensus calculation
 * Allows per-model weights to influence confidence scores
 */

import { ModelPlan, ConsensusStep, ConsensusDecision, ConsensusRisk } from './types.js';

export interface ModelWeights {
  [modelName: string]: number;
}

const MAX_WEIGHT = 3.0;
const DEFAULT_WEIGHT = 1.0;

// Normalize weights to prevent single-model dominance
export function normalizeWeights(weights: ModelWeights): ModelWeights {
  const normalized: ModelWeights = {};

  for (const [model, weight] of Object.entries(weights)) {
    normalized[model] = Math.min(weight, MAX_WEIGHT);
  }

  return normalized;
}

// Calculate weighted confidence
export function calculateWeightedConfidence(
  proposedBy: string[],
  totalModels: number,
  weights?: ModelWeights,
  allModelNames?: string[]
): number {
  if (!weights) {
    return totalModels > 0 ? proposedBy.length / totalModels : 0;
  }

  const normalizedWeights = normalizeWeights(weights);

  // Sum weights of models that proposed this item
  let proposerWeightSum = 0;
  for (const model of proposedBy) {
    proposerWeightSum += normalizedWeights[model] || DEFAULT_WEIGHT;
  }

  // Sum total weights by iterating over ALL models
  let totalWeightSum = 0;
  if (allModelNames && allModelNames.length > 0) {
    // Use actual model names if provided
    for (const modelName of allModelNames) {
      totalWeightSum += normalizedWeights[modelName] || DEFAULT_WEIGHT;
    }
  } else {
    // Fall back to using totalModels count
    for (let i = 0; i < totalModels; i++) {
      totalWeightSum += DEFAULT_WEIGHT;
    }
  }

  return totalWeightSum > 0 ? proposerWeightSum / totalWeightSum : 0;
}

// Borda count for suggested order merging
export function bordaCount(
  suggestedOrders: Array<{ modelName: string; order: string[] }>,
  weights?: ModelWeights
): string[] {
  const normalizedWeights = weights ? normalizeWeights(weights) : undefined;
  const scores = new Map<string, number>();

  // Collect all unique step IDs
  const allStepIds = new Set<string>();
  for (const { order } of suggestedOrders) {
    for (const stepId of order) {
      allStepIds.add(stepId);
    }
  }

  // Calculate Borda scores
  for (const { modelName, order } of suggestedOrders) {
    const modelWeight = normalizedWeights?.[modelName] || DEFAULT_WEIGHT;
    const n = order.length;

    for (let i = 0; i < order.length; i++) {
      const stepId = order[i];
      const currentScore = scores.get(stepId) || 0;

      // Borda score: (n - position) * weight
      // Earlier positions get higher scores
      const bordaScore = (n - i) * modelWeight;
      scores.set(stepId, currentScore + bordaScore);
    }
  }

  // Sort by score (descending)
  const sorted = Array.from(scores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([stepId]) => stepId);

  return sorted;
}
