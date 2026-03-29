import { Step, Decision, Risk } from './types.js';

// Cache for tokenized texts to avoid re-tokenizing
// NOTE: This cache is unbounded by design for CLI use (single-threaded, short-lived process).
// Not thread-safe - intended for single-threaded CLI usage only.
// NOTE: Using long strings as Map keys is memory-inefficient but acceptable for CLI tool scope.
const tokenCache = new Map<string, Set<string>>();
const MAX_CACHE_SIZE = 1000;

export function clearTokenCache(): void {
  tokenCache.clear();
}

function getTokenSet(text: string): Set<string> {
  let tokenSet = tokenCache.get(text);
  if (!tokenSet) {
    tokenSet = new Set(tokenize(text));

    // Limit cache size to prevent unbounded growth
    if (tokenCache.size >= MAX_CACHE_SIZE) {
      // Clear oldest half of cache when limit exceeded
      const keysToDelete = Array.from(tokenCache.keys()).slice(0, Math.floor(MAX_CACHE_SIZE / 2));
      for (const key of keysToDelete) {
        tokenCache.delete(key);
      }
    }

    tokenCache.set(text, tokenSet);
  }
  return tokenSet;
}

export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = getTokenSet(text1);
  const words2 = getTokenSet(text2);

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  // Handle edge case: both texts empty (would produce NaN)
  if (union.size === 0) return 1.0;

  return intersection.size / union.size;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// Generic grouping function
function groupSimilarItems<T>(
  items: Array<{ item: T; modelName: string }>,
  threshold: number,
  getTextForComparison: (item: T) => string
): Array<{ items: Array<{ item: T; modelName: string }> }> {
  const groups: Array<{ items: Array<{ item: T; modelName: string }> }> = [];

  for (const itemWithModel of items) {
    let matched = false;

    for (const group of groups) {
      const representative = group.items[0].item;
      const similarity = calculateSimilarity(
        getTextForComparison(representative),
        getTextForComparison(itemWithModel.item)
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
  threshold: number
): StepGroup[] {
  const genericGroups = groupSimilarItems(
    stepsWithModels.map(s => ({ item: s.step, modelName: s.modelName })),
    threshold,
    (step) => step.title + ' ' + step.description
  );

  return genericGroups.map(g => {
    // Calculate average similarity of group members to the representative item
    const representative = g.items[0].item;
    const representativeText = representative.title + ' ' + representative.description;

    let totalSimilarity = 0;
    // Exclude the representative (index 0) from the average to avoid self-comparison inflation
    for (let i = 1; i < g.items.length; i++) {
      const itemText = g.items[i].item.title + ' ' + g.items[i].item.description;
      totalSimilarity += calculateSimilarity(representativeText, itemText);
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
  threshold: number
): DecisionGroup[] {
  const genericGroups = groupSimilarItems(
    decisionsWithModels.map(d => ({ item: d.decision, modelName: d.modelName })),
    threshold,
    (decision) => decision.question
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
  threshold: number
): RiskGroup[] {
  const genericGroups = groupSimilarItems(
    risksWithModels.map(r => ({ item: r.risk, modelName: r.modelName })),
    threshold,
    (risk) => risk.description
  );

  return genericGroups.map(g => ({
    risks: g.items.map(i => ({ risk: i.item, modelName: i.modelName })),
  }));
}
