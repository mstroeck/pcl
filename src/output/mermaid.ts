import { ConsensusPlan } from '../consensus/types.js';

/**
 * Generate a Mermaid flowchart from the consensus plan's dependency graph
 * Creates a DAG (Directed Acyclic Graph) showing step dependencies
 */
export function formatMermaid(plan: ConsensusPlan): string {
  const lines: string[] = [];

  // Header
  lines.push('```mermaid');
  lines.push('graph TD');

  // Create nodes for each step
  for (const step of plan.steps) {
    const nodeId = sanitizeNodeId(step.id);
    const label = escapeLabel(step.title);

    lines.push(`  ${nodeId}["${label}"]`);
  }

  // Create edges for dependencies
  for (const step of plan.steps) {
    const nodeId = sanitizeNodeId(step.id);

    for (const depId of step.dependencies) {
      const depNodeId = sanitizeNodeId(depId);

      // Only add edge if dependency exists in steps
      if (plan.steps.some((s) => s.id === depId)) {
        lines.push(`  ${depNodeId} --> ${nodeId}`);
      }
    }
  }

  // Add style definitions
  lines.push('');
  lines.push('  classDef architecture fill:#e1f5ff,stroke:#01579b,stroke-width:2px');
  lines.push('  classDef implementation fill:#f3e5f5,stroke:#4a148c,stroke-width:2px');
  lines.push('  classDef testing fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px');
  lines.push('  classDef infrastructure fill:#fff3e0,stroke:#e65100,stroke-width:2px');
  lines.push('  classDef design fill:#fce4ec,stroke:#880e4f,stroke-width:2px');
  lines.push('  classDef research fill:#f1f8e9,stroke:#33691e,stroke-width:2px');
  lines.push('  classDef general fill:#f5f5f5,stroke:#424242,stroke-width:2px');

  // Map steps to their style classes
  for (const step of plan.steps) {
    const nodeId = sanitizeNodeId(step.id);
    lines.push(`  class ${nodeId} ${step.category}`);
  }

  lines.push('```');

  return lines.join('\n');
}

/**
 * Sanitize node IDs for Mermaid
 * Replace spaces, special chars with underscores
 */
function sanitizeNodeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Escape special characters in node labels.
 * Mermaid treats [], (), {}, |, and # as syntax inside label strings.
 */
function escapeLabel(label: string): string {
  return label
    .replace(/"/g, '\\"')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    .replace(/\(/g, '&#40;')
    .replace(/\)/g, '&#41;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/\|/g, '&#124;')
    .replace(/#/g, '&#35;')
    .replace(/\n/g, ' ')
    .slice(0, 50); // Limit length for readability
}

