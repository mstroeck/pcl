import { describe, it, expect } from 'vitest';
import { identifyDisagreements } from './disagreements.js';
import { ModelPlan, ConsensusDecision } from './types.js';

describe('identifyDisagreements', () => {
  it('should identify disagreements when models recommend different approaches', () => {
    const plan1: ModelPlan = {
      modelName: 'model-1',
      summary: 'Plan 1',
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

    const plan2: ModelPlan = {
      modelName: 'model-2',
      summary: 'Plan 2',
      steps: [],
      decisions: [
        {
          question: 'Which database?',
          recommendation: 'MongoDB',
          reasoning: 'Flexibility',
          alternatives: ['PostgreSQL'],
        },
      ],
      risks: [],
      suggestedOrder: [],
    };

    const consensusDecisions: ConsensusDecision[] = [
      {
        question: 'Which database?',
        recommendation: 'PostgreSQL',
        reasoning: 'ACID compliance',
        alternatives: ['MySQL', 'MongoDB'],
        confidence: 1,
        proposedBy: ['model-1', 'model-2'],
        alternativesByModel: {
          'model-1': ['MySQL'],
          'model-2': ['PostgreSQL'],
        },
      },
    ];

    const disagreements = identifyDisagreements([plan1, plan2], consensusDecisions);

    expect(disagreements.length).toBeGreaterThan(0);
    expect(disagreements[0].topic).toBe('Which database?');
    expect(disagreements[0].positions).toHaveLength(2);
  });

  it('should not identify disagreements when models agree', () => {
    const plan1: ModelPlan = {
      modelName: 'model-1',
      summary: 'Plan 1',
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

    const consensusDecisions: ConsensusDecision[] = [
      {
        question: 'Which database?',
        recommendation: 'PostgreSQL',
        reasoning: 'ACID compliance',
        alternatives: ['MySQL'],
        confidence: 1,
        proposedBy: ['model-1', 'model-2'],
        alternativesByModel: {
          'model-1': ['MySQL'],
          'model-2': ['MySQL'],
        },
      },
    ];

    const disagreements = identifyDisagreements([plan1, plan2], consensusDecisions);

    const decisionDisagreements = disagreements.filter((d) => d.topic === 'Which database?');
    expect(decisionDisagreements).toHaveLength(0);
  });
});
