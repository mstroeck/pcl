import chalk from 'chalk';
import { ConsensusPlan, ConsensusStep, ConsensusDecision, ConsensusRisk } from '../consensus/types.js';

export function formatTerminal(plan: ConsensusPlan, verbose: boolean = false): string {
  const output: string[] = [];

  output.push(chalk.bold.cyan('\n📋 Plan Council - Consensus Plan\n'));
  output.push(chalk.gray('─'.repeat(80)));
  output.push('');

  output.push(chalk.bold('Summary:'));
  output.push(plan.summary);
  output.push('');

  // Steps grouped by category
  output.push(chalk.bold.green('\n📝 Steps\n'));

  const stepsByCategory = new Map<string, ConsensusStep[]>();
  for (const step of plan.steps) {
    if (!stepsByCategory.has(step.category)) {
      stepsByCategory.set(step.category, []);
    }
    stepsByCategory.get(step.category)!.push(step);
  }

  for (const [category, steps] of stepsByCategory.entries()) {
    output.push(chalk.bold.yellow(`\n${getCategoryIcon(category)} ${category.toUpperCase()}`));
    output.push('');

    for (const step of steps) {
      output.push(formatStep(step, verbose));
    }
  }

  // Decisions
  if (plan.decisions.length > 0) {
    output.push(chalk.bold.blue('\n🔀 Key Decisions\n'));

    for (const decision of plan.decisions) {
      output.push(formatDecision(decision, verbose));
    }
  }

  // Risks
  if (plan.risks.length > 0) {
    output.push(chalk.bold.red('\n⚠️  Risks\n'));

    for (const risk of plan.risks) {
      output.push(formatRisk(risk, verbose));
    }
  }

  // Disagreements
  if (plan.disagreements.length > 0) {
    output.push(chalk.bold.magenta('\n🤔 Model Disagreements\n'));

    for (const disagreement of plan.disagreements) {
      output.push(chalk.bold(`• ${disagreement.topic}`));
      output.push(`  ${disagreement.description}`);

      if (verbose) {
        for (const position of disagreement.positions) {
          output.push(`  ${chalk.gray(position.modelName)}: ${position.stance}`);
        }
      }

      output.push('');
    }
  }

  // Suggested order
  if (plan.suggestedOrder.length > 0) {
    output.push(chalk.bold.cyan('\n📅 Suggested Execution Order\n'));
    output.push(plan.suggestedOrder.map((id, i) => `${i + 1}. ${id}`).join('\n'));
    output.push('');
  }

  output.push(chalk.gray('─'.repeat(80)));
  output.push(chalk.gray(`\nBased on ${plan.modelPlans.length} model(s): ${plan.modelPlans.map(p => p.modelName).join(', ')}\n`));

  return output.join('\n');
}

function formatStep(step: ConsensusStep, verbose: boolean): string {
  const confidence = Math.round(step.confidence * 100);
  const confidenceColor = confidence >= 70 ? chalk.green : confidence >= 40 ? chalk.yellow : chalk.red;

  const lines: string[] = [];

  lines.push(
    `${chalk.bold(step.title)} ${confidenceColor(`[${confidence}%]`)} ${chalk.gray(`[${step.effort}]`)} ${getRiskBadge(step.risk)}`
  );
  lines.push(`  ${step.description}`);

  if (step.dependencies.length > 0) {
    lines.push(`  ${chalk.gray('Depends on:')} ${step.dependencies.join(', ')}`);
  }

  if (verbose) {
    lines.push(`  ${chalk.gray('Proposed by:')} ${step.proposedBy.join(', ')}`);
  }

  lines.push('');

  return lines.join('\n');
}

function formatDecision(decision: ConsensusDecision, verbose: boolean): string {
  const confidence = Math.round(decision.confidence * 100);
  const confidenceColor = confidence >= 70 ? chalk.green : confidence >= 40 ? chalk.yellow : chalk.red;

  const lines: string[] = [];

  lines.push(`${chalk.bold(decision.question)} ${confidenceColor(`[${confidence}%]`)}`);
  lines.push(`  ${chalk.green('→')} ${decision.recommendation}`);
  lines.push(`  ${chalk.gray(decision.reasoning)}`);

  if (decision.alternatives.length > 0) {
    lines.push(`  ${chalk.gray('Alternatives:')} ${decision.alternatives.join(', ')}`);
  }

  if (verbose) {
    lines.push(`  ${chalk.gray('Proposed by:')} ${decision.proposedBy.join(', ')}`);
  }

  lines.push('');

  return lines.join('\n');
}

function formatRisk(risk: ConsensusRisk, verbose: boolean): string {
  const confidence = Math.round(risk.confidence * 100);
  const confidenceColor = confidence >= 70 ? chalk.green : confidence >= 40 ? chalk.yellow : chalk.red;

  const lines: string[] = [];

  lines.push(`${getSeverityBadge(risk.severity)} ${risk.description} ${confidenceColor(`[${confidence}%]`)}`);
  lines.push(`  ${chalk.gray('Mitigation:')} ${risk.mitigation}`);

  if (verbose) {
    lines.push(`  ${chalk.gray('Flagged by:')} ${risk.proposedBy.join(', ')}`);
  }

  lines.push('');

  return lines.join('\n');
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    architecture: '🏗️',
    implementation: '💻',
    testing: '🧪',
    infrastructure: '🔧',
    design: '🎨',
    research: '🔍',
  };
  return icons[category] || '📦';
}

function getRiskBadge(risk: string): string {
  const badges: Record<string, string> = {
    low: chalk.green('●'),
    medium: chalk.yellow('●'),
    high: chalk.red('●'),
  };
  return badges[risk] || chalk.gray('●');
}

function getSeverityBadge(severity: string): string {
  const badges: Record<string, string> = {
    low: chalk.green('⚠️ LOW'),
    medium: chalk.yellow('⚠️ MEDIUM'),
    high: chalk.red('⚠️ HIGH'),
    critical: chalk.bgRed.white(' CRITICAL '),
  };
  return badges[severity] || chalk.gray('⚠️');
}
