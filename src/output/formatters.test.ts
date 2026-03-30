import { describe, it, expect } from 'vitest';
import { formatTerminal } from './terminal.js';
import { formatMarkdown } from './markdown.js';
import { formatJSON } from './json.js';
import { formatMermaid } from './mermaid.js';
import { formatHTML } from './html.js';
import { ConsensusPlan } from '../consensus/types.js';

const mockPlan: ConsensusPlan = {
  summary: 'Test plan summary',
  steps: [
    {
      id: 'step-1',
      title: 'Setup database',
      description: 'Configure PostgreSQL',
      effort: 'M',
      risk: 'low',
      dependencies: [],
      category: 'infrastructure',
      confidence: 1.0,
      proposedBy: ['model-a'],
      variations: [
        {
          modelName: 'model-a',
          description: 'Configure PostgreSQL',
        },
      ],
    },
  ],
  decisions: [
    {
      question: 'Which framework?',
      recommendation: 'React',
      reasoning: 'Popular and well-supported',
      alternatives: ['Vue', 'Angular'],
      confidence: 0.67,
      proposedBy: ['model-a', 'model-b'],
      alternativesByModel: {
        'model-a': ['Vue'],
        'model-b': ['Angular'],
      },
    },
  ],
  risks: [
    {
      description: 'Data loss during migration',
      severity: 'high',
      mitigation: 'Backup before migration',
      confidence: 1.0,
      proposedBy: ['model-a'],
      severityByModel: {
        'model-a': 'high',
      },
    },
  ],
  disagreements: [],
  suggestedOrder: ['step-1'],
  modelPlans: [],
};

describe('output/formatters', () => {
  describe('formatTerminal', () => {
    it('should format terminal output', () => {
      const output = formatTerminal(mockPlan, false);
      expect(output).toContain('Plan Council');
      expect(output).toContain('Setup database');
      expect(output).toContain('Which framework?');
      expect(output).toContain('Data loss during migration');
      expect(output).toMatchSnapshot();
    });

    it('should include verbose details when enabled', () => {
      const output = formatTerminal(mockPlan, true);
      expect(output).toContain('Proposed by:');
      expect(output).toContain('model-a');
    });
  });

  describe('formatMarkdown', () => {
    it('should format markdown output', () => {
      const output = formatMarkdown(mockPlan, false);
      expect(output).toContain('# Plan Council');
      expect(output).toContain('## Steps');
      expect(output).toContain('### Infrastructure');
      expect(output).toContain('#### Setup database');
      expect(output).toMatchSnapshot();
    });

    it('should include verbose details when enabled', () => {
      const output = formatMarkdown(mockPlan, true);
      expect(output).toContain('**Proposed by:**');
    });
  });

  describe('formatJSON', () => {
    it('should format JSON output with version', () => {
      const output = formatJSON(mockPlan);
      const parsed = JSON.parse(output);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.generatedAt).toBeDefined();
      expect(typeof parsed.generatedAt).toBe('string');
      expect(parsed.plan.summary).toBe('Test plan summary');
      expect(parsed.plan.steps).toHaveLength(1);
      expect(parsed.plan.decisions).toHaveLength(1);
      expect(parsed.plan.risks).toHaveLength(1);
    });
  });

  describe('formatMermaid', () => {
    it('should format Mermaid diagram', () => {
      const output = formatMermaid(mockPlan);
      expect(output).toContain('```mermaid');
      expect(output).toContain('graph TD');
      expect(output).toContain('step_1["Setup database"]');
      expect(output).toContain('classDef infrastructure');
    });

    it('should handle dependencies', () => {
      const planWithDeps: ConsensusPlan = {
        ...mockPlan,
        steps: [
          {
            ...mockPlan.steps[0],
            id: 'step-1',
          },
          {
            id: 'step-2',
            title: 'Deploy app',
            description: 'Deploy to production',
            effort: 'L',
            risk: 'medium',
            dependencies: ['step-1'],
            category: 'infrastructure',
            confidence: 1.0,
            proposedBy: ['model-a'],
            variations: [],
          },
        ],
      };

      const output = formatMermaid(planWithDeps);
      expect(output).toContain('step_1 --> step_2');
    });
  });

  describe('formatHTML', () => {
    it('should format HTML report', () => {
      const output = formatHTML(mockPlan, false);
      expect(output).toContain('<!DOCTYPE html>');
      expect(output).toContain('Plan Council Report');
      expect(output).toContain('Setup database');
      expect(output).toContain('Which framework?');
      expect(output).toContain('Data loss during migration');
    });

    it('should include collapsible sections', () => {
      const output = formatHTML(mockPlan, false);
      expect(output).toContain('collapsible');
      expect(output).toContain('collapsible-content');
    });

    it('should escape HTML special characters', () => {
      const planWithHtml: ConsensusPlan = {
        ...mockPlan,
        summary: 'Test <script>alert("xss")</script> summary',
      };

      const output = formatHTML(planWithHtml, false);
      expect(output).toContain('&lt;script&gt;');
      expect(output).not.toContain('<script>alert("xss")</script>');
    });
  });
});
