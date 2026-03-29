import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCacheKey,
  getFromCache,
  setInCache,
  clearCache,
  getCacheStats,
} from './index.js';

describe('cache/index', () => {
  beforeEach(async () => {
    // Clear cache before each test
    await clearCache();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent hash for same inputs', () => {
      const key1 = generateCacheKey('input1', 'input2', 'input3');
      const key2 = generateCacheKey('input1', 'input2', 'input3');
      expect(key1).toBe(key2);
    });

    it('should generate different hash for different inputs', () => {
      const key1 = generateCacheKey('input1', 'input2');
      const key2 = generateCacheKey('input1', 'input3');
      expect(key1).not.toBe(key2);
    });

    it('should generate valid SHA-256 hash', () => {
      const key = generateCacheKey('test');
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('cache operations', () => {
    it('should return null on cache miss', async () => {
      const result = await getFromCache('nonexistent-key', 3600);
      expect(result).toBeNull();
    });

    it('should store and retrieve value', async () => {
      const key = generateCacheKey('test');
      const value = { data: 'test value', number: 42 };

      await setInCache(key, value, 3600);
      const retrieved = await getFromCache<typeof value>(key, 3600);

      expect(retrieved).toEqual(value);
    });

    it('should handle expired entries', async () => {
      const key = generateCacheKey('test-expire');
      const value = { data: 'test' };

      // Set with very short TTL
      await setInCache(key, value, 0);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should be expired
      const retrieved = await getFromCache(key, 0);
      expect(retrieved).toBeNull();
    });

    it('should clear all cache entries', async () => {
      const key1 = generateCacheKey('test1');
      const key2 = generateCacheKey('test2');

      await setInCache(key1, { data: 'value1' }, 3600);
      await setInCache(key2, { data: 'value2' }, 3600);

      const cleared = await clearCache();
      expect(cleared).toBeGreaterThanOrEqual(2);

      // Verify entries are gone
      const result1 = await getFromCache(key1, 3600);
      const result2 = await getFromCache(key2, 3600);
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('should get cache stats', async () => {
      const key1 = generateCacheKey('stats-test-1');
      const key2 = generateCacheKey('stats-test-2');

      await setInCache(key1, { data: 'value1' }, 3600);
      await setInCache(key2, { data: 'value2' }, 3600);

      const stats = await getCacheStats();
      expect(stats.files).toBeGreaterThanOrEqual(2);
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});
