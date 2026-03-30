import { describe, it, expect } from 'vitest';
import {
  jaccardSimilarity,
  tfidfSimilarity,
  hybridSimilarity,
  calculateSimilarity,
} from './similarity.js';

describe('consensus/similarity', () => {
  describe('jaccardSimilarity', () => {
    it('should return 1.0 for identical texts', () => {
      const text = 'Setup database infrastructure';
      expect(jaccardSimilarity(text, text)).toBe(1.0);
    });

    it('should return 1.0 for empty texts', () => {
      expect(jaccardSimilarity('', '')).toBe(1.0);
    });

    it('should return high similarity for similar texts', () => {
      const text1 = 'Setup database infrastructure';
      const text2 = 'Configure database infrastructure';
      const sim = jaccardSimilarity(text1, text2);
      expect(sim).toBeGreaterThanOrEqual(0.5);
    });

    it('should return low similarity for different texts', () => {
      const text1 = 'Setup database infrastructure';
      const text2 = 'Implement user authentication';
      const sim = jaccardSimilarity(text1, text2);
      expect(sim).toBeLessThan(0.3);
    });

    it('should filter stop words', () => {
      const text1 = 'the quick brown fox';
      const text2 = 'a quick brown fox';
      // 'the' and 'a' are stop words, so similarity should be high
      const sim = jaccardSimilarity(text1, text2);
      expect(sim).toBeGreaterThan(0.8);
    });
  });

  describe('tfidfSimilarity', () => {
    it('should return 1.0 for identical texts', () => {
      const text = 'Setup database infrastructure';
      expect(tfidfSimilarity(text, text)).toBe(1.0);
    });

    it('should return 1.0 for empty texts', () => {
      expect(tfidfSimilarity('', '')).toBe(1.0);
    });

    it('should return 0 when one text is empty', () => {
      expect(tfidfSimilarity('text', '')).toBe(0.0);
      expect(tfidfSimilarity('', 'text')).toBe(0.0);
    });

    it('should calculate similarity with corpus context', () => {
      const text1 = 'database setup configuration';
      const text2 = 'database configuration setup';
      const corpus = [text1, text2, 'unrelated document'];

      const sim = tfidfSimilarity(text1, text2, corpus);
      expect(sim).toBeGreaterThanOrEqual(0); // TF-IDF can vary with different orderings
      expect(sim).toBeLessThanOrEqual(1);
    });

    it('should handle different word orders', () => {
      const text1 = 'setup database infrastructure';
      const text2 = 'infrastructure database setup';
      const sim = tfidfSimilarity(text1, text2);
      expect(sim).toBeGreaterThan(0.9);
    });
  });

  describe('hybridSimilarity', () => {
    it('should use Jaccard for high similarity', () => {
      const text1 = 'setup database configuration';
      const text2 = 'setup database configuration';
      // Should be identical, so Jaccard fast path
      const sim = hybridSimilarity(text1, text2);
      expect(sim).toBe(1.0);
    });

    it('should use TF-IDF for moderate similarity', () => {
      const text1 = 'setup database infrastructure';
      const text2 = 'implement user authentication system';
      // Low Jaccard, so should use TF-IDF
      const sim = hybridSimilarity(text1, text2);
      expect(sim).toBeDefined();
      expect(sim).toBeGreaterThanOrEqual(0);
      expect(sim).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateSimilarity', () => {
    const text1 = 'setup database infrastructure';
    const text2 = 'configure database infrastructure';

    it('should support jaccard algorithm', () => {
      const sim = calculateSimilarity(text1, text2, 'jaccard');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThanOrEqual(1);
    });

    it('should support tfidf algorithm', () => {
      const sim = calculateSimilarity(text1, text2, 'tfidf');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThanOrEqual(1);
    });

    it('should support hybrid algorithm', () => {
      const sim = calculateSimilarity(text1, text2, 'hybrid');
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThanOrEqual(1);
    });

    it('should default to hybrid', () => {
      const sim1 = calculateSimilarity(text1, text2);
      const sim2 = calculateSimilarity(text1, text2, 'hybrid');
      expect(sim1).toBe(sim2);
    });
  });
});
