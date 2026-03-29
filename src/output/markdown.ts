import { ConsensusPlan, ConsensusStep, ConsensusDecision, ConsensusRisk } from '../consensus/types.js';

export function formatMarkdown(plan: ConsensusPlan, verbose: boolean = false): string {
  const output: string[] = [];

  output.push('# Plan Council - Consensus Plan\n');
  output.push(`**Summary:** ${plan.summary}\n`);
  output.push(`**Models:** ${plan.modelPlans.map(p => p.modelName).join(', ')}\n`);

  // Steps
  output.push('## Steps\n');

  const stepsByCategory = new Map<string, ConsensusStep[]>();
  for (const step of plan.steps) {
    if (!stepsByCategory.has(step.category)) {
      stepsByCategory.set(step.category, []);
    }
    stepsByCategory.get(step.category)!.push(step);
  }

  for (const [category, steps] of stepsByCategory.entries()) {
    output.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`);

    for (const step of steps) {
      output.push(formatStepMarkdown(step, verbose));
    }
  }

  // Decisions
  if (plan.decisions.length > 0) {
    output.push('## Key Decisions\n');

    for (const decision of plan.decisions) {
      output.push(formatDecisionMarkdown(decision, verbose));
    }
  }

  // Risks
  if (plan.risks.length > 0) {
    output.push('## Risks\n');

    for (const risk of plan.risks) {
      output.push(formatRiskMarkdown(risk, verbose));
    }
  }

  // Disagreements
  if (plan.disagreements.length > 0) {
    output.push('## Model Disagreements\n');

    for (const disagreement of plan.disagreements) {
      output.push(`### ${disagreement.topic}\n`);
      output.push(`${disagreement.description}\n`);

      if (verbose) {
        for (const position of disagreement.positions) {
          output.push(`- **${position.modelName}**: ${position.stance}`);
        }
        output.push('');
      }
    }
  }

  // Suggested order
  if (plan.suggestedOrder.length > 0) {
    output.push('## Suggested Execution Order\n');

    for (let i = 0; i < plan.suggestedOrder.length; i++) {
      output.push(`${i + 1}. ${plan.suggestedOrder[i]}`);
    }
    output.push('');
  }

  return output.join('\n');
}

function formatStepMarkdown(step: ConsensusStep, verbose: boolean): string {
  const confidence = Math.round(step.confidence * 100);
  const lines: string[] = [];

  lines.push(`#### ${step.title}`);
  lines.push('');
  lines.push(`**Confidence:** ${confidence}% | **Effort:** ${step.effort} | **Risk:** ${step.risk}`);
  lines.push('');
  lines.push(step.description);
  lines.push('');

  if (step.dependencies.length > 0) {
    lines.push(`**Dependencies:** ${step.dependencies.join(', ')}`);
    lines.push('');
  }

  if (verbose) {
    lines.push(`**Proposed by:** ${step.proposedBy.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

function formatDecisionMarkdown(decision: ConsensusDecision, verbose: boolean): string {
  const confidence = Math.round(decision.confidence * 100);
  const lines: string[] = [];

  lines.push(`### ${decision.question}`);
  lines.push('');
  lines.push(`**Confidence:** ${confidence}%`);
  lines.push('');
  lines.push(`**Recommendation:** ${decision.recommendation}`);
  lines.push('');
  lines.push(`**Reasoning:** ${decision.reasoning}`);
  lines.push('');

  if (decision.alternatives.length > 0) {
    lines.push(`**Alternatives:** ${decision.alternatives.join(', ')}`);
    lines.push('');
  }

  if (verbose) {
    lines.push(`**Proposed by:** ${decision.proposedBy.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}

function formatRiskMarkdown(risk: ConsensusRisk, verbose: boolean): string {
  const confidence = Math.round(risk.confidence * 100);
  const lines: string[] = [];

  lines.push(`### ${risk.description}`);
  lines.push('');
  lines.push(`**Severity:** ${risk.severity.toUpperCase()} | **Confidence:** ${confidence}%`);
  lines.push('');
  lines.push(`**Mitigation:** ${risk.mitigation}`);
  lines.push('');

  if (verbose) {
    lines.push(`**Flagged by:** ${risk.proposedBy.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n');
}
