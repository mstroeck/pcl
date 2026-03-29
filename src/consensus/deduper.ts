import { Step, Decision, Risk } from './types.js';

export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(tokenize(text1));
  const words2 = new Set(tokenize(text2));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export interface StepGroup {
  steps: Array<{ step: Step; modelName: string }>;
  similarity: number;
}

export function groupSimilarSteps(
  stepsWithModels: Array<{ step: Step; modelName: string }>,
  threshold: number
): StepGroup[] {
  const groups: StepGroup[] = [];

  for (const item of stepsWithModels) {
    let matched = false;

    for (const group of groups) {
      const representative = group.steps[0].step;
      const similarity = calculateSimilarity(
        representative.title + ' ' + representative.description,
        item.step.title + ' ' + item.step.description
      );

      if (similarity >= threshold) {
        group.steps.push(item);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({ steps: [item], similarity: 1.0 });
    }
  }

  return groups;
}

export interface DecisionGroup {
  decisions: Array<{ decision: Decision; modelName: string }>;
}

export function groupSimilarDecisions(
  decisionsWithModels: Array<{ decision: Decision; modelName: string }>,
  threshold: number
): DecisionGroup[] {
  const groups: DecisionGroup[] = [];

  for (const item of decisionsWithModels) {
    let matched = false;

    for (const group of groups) {
      const representative = group.decisions[0].decision;
      const similarity = calculateSimilarity(representative.question, item.decision.question);

      if (similarity >= threshold) {
        group.decisions.push(item);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({ decisions: [item] });
    }
  }

  return groups;
}

export interface RiskGroup {
  risks: Array<{ risk: Risk; modelName: string }>;
}

export function groupSimilarRisks(
  risksWithModels: Array<{ risk: Risk; modelName: string }>,
  threshold: number
): RiskGroup[] {
  const groups: RiskGroup[] = [];

  for (const item of risksWithModels) {
    let matched = false;

    for (const group of groups) {
      const representative = group.risks[0].risk;
      const similarity = calculateSimilarity(representative.description, item.risk.description);

      if (similarity >= threshold) {
        group.risks.push(item);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.push({ risks: [item] });
    }
  }

  return groups;
}
