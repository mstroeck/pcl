import { describe, it, expect } from 'vitest';
import { mergeSteps, mergeDecisions, mergeRisks } from './merger.js';
import { ModelPlan } from './types.js';

describe('mergeSteps', () => {
  it('should merge identical steps from multiple models', () => {
    const plan1: ModelPlan = {
      modelName: 'model-1',
      summary: 'Plan 1',
      steps: [
        {
          id: 'step-1',
          title: 'Setup database',
          description: 'Configure PostgreSQL',
          effort: 'M',
          risk: 'low',
          dependencies: [],
          category: 'infrastructure',
        },
      ],
      decisions: [],
      risks: [],
      suggestedOrder: ['step-1'],
    };

    const plan2: ModelPlan = {
      modelName: 'model-2',
      summary: 'Plan 2',
      steps: [
        {
          id: 'step-1',
          title: 'Setup database',
          description: 'Configure PostgreSQL',
          effort: 'M',
          risk: 'low',
          dependencies: [],
          category: 'infrastructure',
        },
      ],
      decisions: [],
      risks: [],
      suggestedOrder: ['step-1'],
    };

    const merged = mergeSteps([plan1, plan2], 0.7, 0.5);

    expect(merged).toHaveLength(1);
    expect(merged[0].confidence).toBe(1); // Both models proposed it
    expect(merged[0].proposedBy).toEqual(['model-1', 'model-2']);
  });

  it('should keep separate steps when dissimilar', () => {
    const plan1: ModelPlan = {
      modelName: 'model-1',
      summary: 'Plan 1',
      steps: [
        {
          id: 'step-1',
          title: 'Setup database',
          description: 'Configure PostgreSQL',
          effort: 'M',
          risk: 'low',
          dependencies: [],
          category: 'infrastructure',
        },
      ],
      decisions: [],
      risks: [],
      suggestedOrder: ['step-1'],
    };

    const plan2: ModelPlan = {
      modelName: 'model-2',
      summary: 'Plan 2',
      steps: [
        {
          id: 'step-2',
          title: 'Write tests',
          description: 'Add unit tests',
          effort: 'S',
          risk: 'low',
          dependencies: [],
          category: 'testing',
        },
      ],
      decisions: [],
      risks: [],
      suggestedOrder: ['step-2'],
    };

    const merged = mergeSteps([plan1, plan2], 0.7, 0.5);

    expect(merged).toHaveLength(2);
    expect(merged[0].confidence).toBe(0.5);
    expect(merged[1].confidence).toBe(0.5);
  });
});

describe('mergeDecisions', () => {
  it('should merge similar decisions', () => {
    const plan1: ModelPlan = {
      modelName: 'model-1',
      summary: 'Plan 1',
      steps: [],
      decisions: [
        {
          question: 'Which database?',
          recommendation: 'PostgreSQL',
          reasoning: 'ACID compliance',
          alternatives: ['MySQL', 'MongoDB'],
        },
      ],
      risks: [],
      suggestedOrder: [],
    };

    const plan2: ModelPlan = {
      modelName: 'model-2',
      summary: 'Plan 2',
      steps: [],
      decisions: [
        {
          question: 'Which database?',
          recommendation: 'PostgreSQL',
          reasoning: 'ACID compliance',
          alternatives: ['MySQL'],
        },
      ],
      risks: [],
      suggestedOrder: [],
    };

    const merged = mergeDecisions([plan1, plan2], 0.7, 0.5);

    expect(merged).toHaveLength(1);
    expect(merged[0].confidence).toBe(1);
  });
});

describe('mergeRisks', () => {
  it('should elevate severity when multiple models flag a risk', () => {
    const plan1: ModelPlan = {
      modelName: 'model-1',
      summary: 'Plan 1',
      steps: [],
      decisions: [],
      risks: [
        {
          description: 'Data loss',
          severity: 'high',
          mitigation: 'Backups',
        },
      ],
      suggestedOrder: [],
    };

    const plan2: ModelPlan = {
      modelName: 'model-2',
      summary: 'Plan 2',
      steps: [],
      decisions: [],
      risks: [
        {
          description: 'Data loss',
          severity: 'critical',
          mitigation: 'Backups',
        },
      ],
      suggestedOrder: [],
    };

    const merged = mergeRisks([plan1, plan2], 0.7, 0.5);

    expect(merged).toHaveLength(1);
    expect(merged[0].severity).toBe('critical'); // Should use max severity
    expect(merged[0].confidence).toBe(1);
  });
});
