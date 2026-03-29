/**
 * LLM meta-synthesis - use one model to review and improve the mechanical consensus
 */

import { ConsensusPlan } from './types.js';
import { ModelConfig } from '../config/schema.js';
import { dispatchToModels } from '../dispatch/runner.js';

const SYNTHESIS_PROMPT = `You are reviewing a mechanically-merged plan created from multiple AI models' outputs.

Your task is to:
1. Check for logical coherence - do the steps flow naturally?
2. Identify any gaps or missing steps between what the models proposed
3. Validate dependencies are correct
4. Improve the overall summary to be more cohesive
5. Note any contradictions or unclear points

Provide your analysis as JSON:
{
  "coherenceIssues": ["issue 1", "issue 2"],
  "gaps": ["gap 1", "gap 2"],
  "dependencyIssues": ["issue 1"],
  "improvedSummary": "Better summary text",
  "recommendations": ["rec 1", "rec 2"]
}`;

export interface SynthesisResult {
  coherenceIssues: string[];
  gaps: string[];
  dependencyIssues: string[];
  improvedSummary: string;
  recommendations: string[];
}

export async function synthesizePlan(
  plan: ConsensusPlan,
  model: ModelConfig
): Promise<SynthesisResult | null> {
  try {
    // Build synthesis prompt
    const planSummary = JSON.stringify(
      {
        summary: plan.summary,
        steps: plan.steps.map((s) => ({
          id: s.id,
          title: s.title,
          dependencies: s.dependencies,
          proposedBy: s.proposedBy,
        })),
        decisions: plan.decisions.map((d) => ({
          question: d.question,
          recommendation: d.recommendation,
          proposedBy: d.proposedBy,
        })),
      },
      null,
      2
    );

    const userPrompt = `Review this consensus plan:\n\n${planSummary}`;

    const responses = await dispatchToModels(
      [model],
      {
        systemPrompt: SYNTHESIS_PROMPT,
        userPrompt,
        maxTokens: 2048,
        temperature: 0.3, // Lower temperature for analytical task
        timeout: 60000,
      },
      { useCache: true, cacheTTL: 3600 }
    );

    if (responses[0].error || !responses[0].content) {
      return null;
    }

    // Parse JSON response
    const content = responses[0].content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return null;
    }

    const result: SynthesisResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error) {
    return null;
  }
}
