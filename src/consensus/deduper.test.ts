import { describe, it, expect } from 'vitest';
import { calculateSimilarity, groupSimilarSteps } from './deduper.js';
import { Step } from './types.js';

describe('calculateSimilarity', () => {
  it('should return 1 for identical strings', () => {
    expect(calculateSimilarity('hello world', 'hello world')).toBe(1);
  });

  it('should return 0 for completely different strings', () => {
    const similarity = calculateSimilarity('abc', 'xyz');
    expect(similarity).toBe(0);
  });

  it('should return value between 0 and 1 for partially similar strings', () => {
    const similarity = calculateSimilarity('hello world', 'hello universe');
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });
});

describe('groupSimilarSteps', () => {
  it('should group identical steps', () => {
    const step1: Step = {
      id: 'step-1',
      title: 'Setup database',
      description: 'Configure PostgreSQL',
      effort: 'M',
      risk: 'low',
      dependencies: [],
      category: 'infrastructure',
    };

    const step2: Step = {
      id: 'step-2',
      title: 'Setup database',
      description: 'Configure PostgreSQL',
      effort: 'M',
      risk: 'low',
      dependencies: [],
      category: 'infrastructure',
    };

    const stepsWithModels = [
      { step: step1, modelName: 'model-1' },
      { step: step2, modelName: 'model-2' },
    ];

    const groups = groupSimilarSteps(stepsWithModels, 0.7);

    expect(groups).toHaveLength(1);
    expect(groups[0].steps).toHaveLength(2);
  });

  it('should not group dissimilar steps', () => {
    const step1: Step = {
      id: 'step-1',
      title: 'Setup database',
      description: 'Configure PostgreSQL',
      effort: 'M',
      risk: 'low',
      dependencies: [],
      category: 'infrastructure',
    };

    const step2: Step = {
      id: 'step-2',
      title: 'Write tests',
      description: 'Add unit tests',
      effort: 'S',
      risk: 'low',
      dependencies: [],
      category: 'testing',
    };

    const stepsWithModels = [
      { step: step1, modelName: 'model-1' },
      { step: step2, modelName: 'model-2' },
    ];

    const groups = groupSimilarSteps(stepsWithModels, 0.7);

    expect(groups).toHaveLength(2);
  });
});
