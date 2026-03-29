import { Step, Decision, Risk } from './types.js';
import { calculateSimilarity as calcSimilarity, SimilarityAlgorithm } from './similarity.js';

// Default similarity algorithm
const DEFAULT_ALGORITHM: SimilarityAlgorithm = 'hybrid';

export function calculateSimilarity(
  text1: string,
  text2: string,
  algorithm: SimilarityAlgorithm = DEFAULT_ALGORITHM
): number {
  return calcSimilarity(text1, text2, algorithm);
}

// For backwards compatibility with tests
export function clearTokenCache(): void {
  // No-op - similarity module handles its own state
}

// Generic grouping function
function groupSimilarItems<T>(
  items: Array<{ item: T; modelName: string }>,
  threshold: number,
  getTextForComparison: (item: T) => string,
  algorithm: SimilarityAlgorithm = DEFAULT_ALGORITHM
): Array<{ items: Array<{ item: T; modelName: string }> }> {
  const groups: Array<{ items: Array<{ item: T; modelName: string }> }> = [];

  for (const itemWithModel of items) {
    let matched = false;

    for (const group of groups) {
      const representative = group.items[0].item;
      const similarity = calculateSimilarity(
        getTextForComparison(representative),
        getTextForComparison(itemWithModel.item),
        algorithm
      );

      if (similarity >= threshold) {
        group.items.push(itemWithModel);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({ items: [itemWithModel] });
    }
  }

  return groups;
}

export interface StepGroup {
  steps: Array<{ step: Step; modelName: string }>;
  similarity: number;
}

export function groupSimilarSteps(
  stepsWithModels: Array<{ step: Step; modelName: string }>,
  threshold: number,
  algorithm: SimilarityAlgorithm = DEFAULT_ALGORITHM
): StepGroup[] {
  const genericGroups = groupSimilarItems(
    stepsWithModels.map(s => ({ item: s.step, modelName: s.modelName })),
    threshold,
    (step) => step.title + ' ' + step.description,
    algorithm
  );

  return genericGroups.map(g => {
    // Calculate average similarity of group members to the representative item
    const representative = g.items[0].item;
    const representativeText = representative.title + ' ' + representative.description;

    let totalSimilarity = 0;
    // Exclude the representative (index 0) from the average to avoid self-comparison inflation
    for (let i = 1; i < g.items.length; i++) {
      const itemText = g.items[i].item.title + ' ' + g.items[i].item.description;
      totalSimilarity += calculateSimilarity(representativeText, itemText, algorithm);
    }
    // If only one item, similarity is 1.0; otherwise average the non-representative items
    const avgSimilarity = g.items.length > 1 ? totalSimilarity / (g.items.length - 1) : 1.0;

    return {
      steps: g.items.map(i => ({ step: i.item, modelName: i.modelName })),
      similarity: avgSimilarity,
    };
  });
}

export interface DecisionGroup {
  decisions: Array<{ decision: Decision; modelName: string }>;
}

export function groupSimilarDecisions(
  decisionsWithModels: Array<{ decision: Decision; modelName: string }>,
  threshold: number,
  algorithm: SimilarityAlgorithm = DEFAULT_ALGORITHM
): DecisionGroup[] {
  const genericGroups = groupSimilarItems(
    decisionsWithModels.map(d => ({ item: d.decision, modelName: d.modelName })),
    threshold,
    (decision) => decision.question,
    algorithm
  );

  return genericGroups.map(g => ({
    decisions: g.items.map(i => ({ decision: i.item, modelName: i.modelName })),
  }));
}

export interface RiskGroup {
  risks: Array<{ risk: Risk; modelName: string }>;
}

export function groupSimilarRisks(
  risksWithModels: Array<{ risk: Risk; modelName: string }>,
  threshold: number,
  algorithm: SimilarityAlgorithm = DEFAULT_ALGORITHM
): RiskGroup[] {
  const genericGroups = groupSimilarItems(
    risksWithModels.map(r => ({ item: r.risk, modelName: r.modelName })),
    threshold,
    (risk) => risk.description,
    algorithm
  );

  return genericGroups.map(g => ({
    risks: g.items.map(i => ({ risk: i.item, modelName: i.modelName })),
  }));
}
