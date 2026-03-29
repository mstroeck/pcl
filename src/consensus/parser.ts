import { ModelPlan, Step, Decision, Risk, Effort } from './types.js';

export function parseModelPlan(modelName: string, jsonContent: string): ModelPlan {
  try {
    const parsed = JSON.parse(jsonContent);

    return {
      modelName,
      summary: parsed.summary || '',
      steps: (parsed.steps || []).map((s: any) => ({
        id: s.id || '',
        title: s.title || '',
        description: s.description || '',
        effort: (s.effort || 'M') as Effort,
        risk: s.risk || 'low',
        dependencies: s.dependencies || [],
        category: s.category || 'implementation',
      })),
      decisions: (parsed.decisions || []).map((d: any) => ({
        question: d.question || '',
        recommendation: d.recommendation || '',
        reasoning: d.reasoning || '',
        alternatives: d.alternatives || [],
      })),
      risks: (parsed.risks || []).map((r: any) => ({
        description: r.description || '',
        severity: r.severity || 'low',
        mitigation: r.mitigation || '',
      })),
      estimatedTotalEffort: parsed.estimatedTotalEffort as Effort | undefined,
      suggestedOrder: parsed.suggestedOrder || [],
    };
  } catch (error) {
    throw new Error(`Failed to parse plan from ${modelName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
