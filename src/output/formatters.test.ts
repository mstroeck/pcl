import { describe, it, expect } from 'vitest';
import { formatTerminal } from './terminal.js';
import { formatMarkdown } from './markdown.js';
import { formatJSON } from './json.js';
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
    it('should format JSON output', () => {
      const output = formatJSON(mockPlan);
      const parsed = JSON.parse(output);
      expect(parsed.summary).toBe('Test plan summary');
      expect(parsed.steps).toHaveLength(1);
      expect(parsed.decisions).toHaveLength(1);
      expect(parsed.risks).toHaveLength(1);
      expect(output).toMatchSnapshot();
    });
  });
});
