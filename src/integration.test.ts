import { describe, it, expect } from 'vitest';
import { parseModelPlan } from './consensus/parser.js';
import { mergeSteps, mergeDecisions, mergeRisks } from './consensus/merger.js';
import { identifyDisagreements } from './consensus/disagreements.js';

const mockAnthropicResponse = JSON.stringify({
  summary: 'Anthropic plan summary',
  steps: [
    {
      id: 'step-1',
      title: 'Setup infrastructure',
      description: 'Configure AWS resources',
      effort: 'L',
      risk: 'medium',
      dependencies: [],
      category: 'infrastructure',
    },
    {
      id: 'step-2',
      title: 'Implement API',
      description: 'Build REST API endpoints',
      effort: 'M',
      risk: 'low',
      dependencies: ['step-1'],
      category: 'implementation',
    },
  ],
  decisions: [
    {
      question: 'Which database to use?',
      recommendation: 'PostgreSQL',
      reasoning: 'Strong ACID guarantees',
      alternatives: ['MySQL', 'MongoDB'],
    },
  ],
  risks: [
    {
      description: 'Data migration complexity',
      severity: 'medium',
      mitigation: 'Comprehensive testing strategy',
    },
  ],
  suggestedOrder: ['step-1', 'step-2'],
});

const mockOpenAIResponse = JSON.stringify({
  summary: 'OpenAI plan summary',
  steps: [
    {
      id: 'step-a',
      title: 'Setup infrastructure',
      description: 'Configure cloud resources',
      effort: 'L',
      risk: 'low',
      dependencies: [],
      category: 'infrastructure',
    },
    {
      id: 'step-b',
      title: 'Build authentication',
      description: 'Implement OAuth2 flow',
      effort: 'M',
      risk: 'medium',
      dependencies: ['step-a'],
      category: 'implementation',
    },
  ],
  decisions: [
    {
      question: 'Which database to use?',
      recommendation: 'PostgreSQL',
      reasoning: 'Excellent for relational data',
      alternatives: ['MySQL'],
    },
  ],
  risks: [
    {
      description: 'Security vulnerabilities',
      severity: 'high',
      mitigation: 'Security audit and penetration testing',
    },
  ],
  suggestedOrder: ['step-a', 'step-b'],
});

const mockGoogleResponse = JSON.stringify({
  summary: 'Google plan summary',
  steps: [
    {
      id: 'step-x',
      title: 'Setup infrastructure',
      description: 'Setup GCP infrastructure',
      effort: 'M',
      risk: 'low',
      dependencies: [],
      category: 'infrastructure',
    },
  ],
  decisions: [
    {
      question: 'Which database to use?',
      recommendation: 'Cloud SQL',
      reasoning: 'Native GCP integration',
      alternatives: ['Firestore'],
    },
  ],
  risks: [],
  suggestedOrder: ['step-x'],
});

describe('Integration: Consensus Pipeline', () => {
  it('should run full consensus pipeline with 3 models', () => {
    // Step 1: Parse responses
    const plans = [
      parseModelPlan('claude-opus-4-6', mockAnthropicResponse),
      parseModelPlan('gpt-5', mockOpenAIResponse),
      parseModelPlan('gemini-2.5-pro', mockGoogleResponse),
    ];

    expect(plans).toHaveLength(3);
    expect(plans[0].modelName).toBe('claude-opus-4-6');
    expect(plans[1].modelName).toBe('gpt-5');
    expect(plans[2].modelName).toBe('gemini-2.5-pro');

    // Step 2: Merge with consensus
    const threshold = 0.7;
    const consensusThreshold = 0.33; // At least 1 of 3 models

    const mergedSteps = mergeSteps(plans, threshold, consensusThreshold);
    const mergedDecisions = mergeDecisions(plans, threshold, consensusThreshold);
    const mergedRisks = mergeRisks(plans, threshold, consensusThreshold);

    // Verify merged steps
    expect(mergedSteps.length).toBeGreaterThan(0);
    const infraStep = mergedSteps.find((s) =>
      s.title.toLowerCase().includes('infrastructure')
    );
    expect(infraStep).toBeDefined();
    expect(infraStep!.proposedBy.length).toBeGreaterThanOrEqual(1); // At least 1 model proposes this

    // Verify consensus mechanism works
    const allProposedBy = mergedSteps.flatMap((s) => s.proposedBy);
    expect(allProposedBy.length).toBeGreaterThan(0);

    // Verify merged decisions
    expect(mergedDecisions.length).toBeGreaterThan(0);
    const dbDecision = mergedDecisions.find((d) =>
      d.question.toLowerCase().includes('database')
    );
    expect(dbDecision).toBeDefined();
    expect(dbDecision!.proposedBy.length).toBe(3); // All 3 models propose this

    // Verify merged risks
    expect(mergedRisks.length).toBeGreaterThan(0);

    // Step 3: Detect disagreements
    const disagreements = identifyDisagreements(plans, mergedDecisions);
    expect(Array.isArray(disagreements)).toBe(true);
    // Database recommendation varies, so there should be disagreements
    const dbDisagreement = disagreements.find((d) =>
      d.topic.toLowerCase().includes('database')
    );
    expect(dbDisagreement).toBeDefined();
  });

  it('should handle single model gracefully', () => {
    const plans = [parseModelPlan('claude-opus-4-6', mockAnthropicResponse)];

    expect(plans).toHaveLength(1);

    const mergedSteps = mergeSteps(plans, 0.7, 0.5);

    // All steps should have 100% confidence with single model
    for (const step of mergedSteps) {
      expect(step.confidence).toBe(1.0);
      expect(step.proposedBy).toHaveLength(1);
    }
  });
});
