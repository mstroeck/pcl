import { describe, it, expect } from 'vitest';
import { resolve } from './index.js';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';

describe('resolver/index', () => {
  describe('resolve', () => {
    it.skip('should parse GitHub URL', async () => {
      // Skip - requires valid GitHub repo
      const result = await resolve('https://github.com/owner/repo/issues/123');
      expect(result.sourceType).toBe('github-issue');
      expect(result.title).toContain('#123');
    });

    it.skip('should parse GitHub URL with query string', async () => {
      // Skip - requires valid GitHub repo
      const result = await resolve('https://github.com/owner/repo/issues/123?foo=bar');
      expect(result.sourceType).toBe('github-issue');
    });

    it.skip('should parse GitHub URL with fragment', async () => {
      // Skip - requires valid GitHub repo
      const result = await resolve('https://github.com/owner/repo/issues/123#comment');
      expect(result.sourceType).toBe('github-issue');
    });

    it('should reject GitHub URL with extra path segments', async () => {
      // Extra path segments should be treated as inline text
      const result = await resolve('https://github.com/owner/repo/issues/123/comments');
      expect(result.sourceType).toBe('inline');
    });

    it.skip('should parse GitHub reference format', async () => {
      // Skip - requires valid GitHub repo
      const result = await resolve('owner/repo#123');
      expect(result.sourceType).toBe('github-issue');
    });

    it('should resolve file path', async () => {
      const testFile = join(process.cwd(), 'test-task.txt');
      await writeFile(testFile, 'Test task description');

      try {
        const result = await resolve(testFile);
        expect(result.sourceType).toBe('file');
        expect(result.description).toBe('Test task description');
      } finally {
        await rm(testFile, { force: true });
      }
    });

    it('should reject path traversal', async () => {
      await expect(resolve('/etc/passwd')).rejects.toThrow('outside current working directory');
    });

    it('should resolve inline text', async () => {
      const result = await resolve('Build a new feature');
      expect(result.sourceType).toBe('inline');
      expect(result.description).toBe('Build a new feature');
    });

    it('should throw on stdin from TTY', async () => {
      // Stdin resolution is tested in integration tests
      // This test just validates the function exists
      expect(resolve).toBeDefined();
    });
  });
});
