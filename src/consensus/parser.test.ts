import { describe, it, expect } from 'vitest';
import { parseModelPlan } from './parser.js';

describe('parseModelPlan', () => {
  it('should parse valid JSON plan', () => {
    const json = JSON.stringify({
      summary: 'Test plan',
      steps: [
        {
          id: 'step-1',
          title: 'First step',
          description: 'Do something',
          effort: 'M',
          risk: 'low',
          dependencies: [],
          category: 'implementation',
        },
      ],
      decisions: [],
      risks: [],
      suggestedOrder: ['step-1'],
    });

    const plan = parseModelPlan('test-model', json);

    expect(plan.modelName).toBe('test-model');
    expect(plan.summary).toBe('Test plan');
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].id).toBe('step-1');
  });

  it('should handle missing optional fields', () => {
    const json = JSON.stringify({
      summary: 'Test plan',
      steps: [],
      decisions: [],
      risks: [],
      suggestedOrder: [],
    });

    const plan = parseModelPlan('test-model', json);

    expect(plan.steps).toEqual([]);
    expect(plan.decisions).toEqual([]);
    expect(plan.risks).toEqual([]);
  });

  it('should throw on invalid JSON', () => {
    expect(() => parseModelPlan('test-model', 'invalid json')).toThrow();
  });

  it('should apply default values for optional step fields', () => {
    const json = JSON.stringify({
      summary: 'Test plan',
      steps: [
        {
          id: 'step-1',
          title: 'First step',
          description: 'Do something',
          // Missing effort, risk, dependencies, category - should get defaults
        },
      ],
      decisions: [
        {
          question: 'Which approach?',
          recommendation: 'Use REST',
          reasoning: 'Simple and standard',
          // Missing alternatives - should get default []
        },
      ],
      risks: [],
      suggestedOrder: ['step-1'],
    });

    const plan = parseModelPlan('test-model', json);

    expect(plan.steps[0].effort).toBe('M');
    expect(plan.steps[0].risk).toBe('low');
    expect(plan.steps[0].dependencies).toEqual([]);
    expect(plan.steps[0].category).toBe('general');
    expect(plan.decisions[0].alternatives).toEqual([]);
  });
});
