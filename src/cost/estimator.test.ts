import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateCost, formatCostEstimate } from './estimator.js';
import { ModelConfig } from '../config/schema.js';

describe('cost/estimator', () => {
  describe('estimateTokens', () => {
    it('should estimate tokens for ASCII text', () => {
      const tokens = estimateTokens('hello world');
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThan(20);
    });

    it('should handle empty string', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should handle multi-byte UTF-8 characters', () => {
      const ascii = estimateTokens('test');
      const emoji = estimateTokens('👋🌍🎉✨');
      // Emoji takes more bytes, so more estimated tokens
      expect(emoji).toBeGreaterThan(ascii);
    });

    it('should handle long text', () => {
      const longText = 'word '.repeat(1000);
      const tokens = estimateTokens(longText);
      expect(tokens).toBeGreaterThan(1000);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for known model', () => {
      const models: ModelConfig[] = [
        { provider: 'anthropic', model: 'claude-opus-4-6' },
      ];
      const estimate = estimateCost(models, 'test input', 1000);

      expect(estimate.models).toHaveLength(1);
      expect(estimate.models[0].model).toBe('claude-opus-4-6');
      expect(estimate.models[0].estimatedCost).toBeGreaterThan(0);
      expect(estimate.totalCost).toBe(estimate.models[0].estimatedCost);
    });

    it('should use fallback pricing for unknown model', () => {
      const models: ModelConfig[] = [
        { provider: 'openai', model: 'unknown-model-xyz' },
      ];
      const estimate = estimateCost(models, 'test', 1000);

      expect(estimate.models[0].estimatedCost).toBeGreaterThan(0);
    });

    it('should sum costs for multiple models', () => {
      const models: ModelConfig[] = [
        { provider: 'anthropic', model: 'claude-opus-4-6' },
        { provider: 'openai', model: 'gpt-5' },
      ];
      const estimate = estimateCost(models, 'test input', 1000);

      expect(estimate.models).toHaveLength(2);
      expect(estimate.totalCost).toBe(
        estimate.models[0].estimatedCost + estimate.models[1].estimatedCost
      );
    });

    it('should calculate cost correctly with zero input', () => {
      const models: ModelConfig[] = [
        { provider: 'anthropic', model: 'claude-haiku-4' },
      ];
      const estimate = estimateCost(models, '', 1000);

      expect(estimate.models[0].inputTokens).toBe(0);
      expect(estimate.models[0].estimatedCost).toBeGreaterThan(0); // Output still costs
    });
  });

  describe('formatCostEstimate', () => {
    it('should format cost estimate', () => {
      const estimate = {
        models: [
          {
            model: 'claude-opus-4-6',
            inputTokens: 100,
            outputTokens: 2000,
            estimatedCost: 0.1234,
          },
        ],
        totalCost: 0.1234,
      };

      const formatted = formatCostEstimate(estimate);
      expect(formatted).toContain('Cost Estimate');
      expect(formatted).toContain('claude-opus-4-6');
      expect(formatted).toContain('$0.1234');
      expect(formatted).toContain('100 in');
      expect(formatted).toContain('2000 out');
      expect(formatted).toContain('Total');
    });
  });
});
