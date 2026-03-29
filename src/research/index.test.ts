import { describe, it, expect } from 'vitest';
import { formatResearchForPrompt } from './index.js';
import { ResearchResponse } from './types.js';

describe('research/index', () => {
  describe('formatResearchForPrompt', () => {
    it('should format research without citations', () => {
      const research: ResearchResponse = {
        content: 'Research content about the topic',
        provider: 'perplexity',
        model: 'sonar-deep-research',
      };

      const formatted = formatResearchForPrompt(research);

      expect(formatted).toContain('<domain-research>');
      expect(formatted).toContain('</domain-research>');
      expect(formatted).toContain('Provider: perplexity');
      expect(formatted).toContain('Research content about the topic');
    });

    it('should format research with citations', () => {
      const research: ResearchResponse = {
        content: 'Research content about the topic',
        citations: ['https://example.com/1', 'https://example.com/2'],
        provider: 'perplexity',
        model: 'sonar-deep-research',
      };

      const formatted = formatResearchForPrompt(research);

      expect(formatted).toContain('Citations:');
      expect(formatted).toContain('https://example.com/1');
      expect(formatted).toContain('https://example.com/2');
    });
  });
});
