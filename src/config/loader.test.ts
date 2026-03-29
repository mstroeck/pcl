import { describe, it, expect } from 'vitest';
import { parseModelString, parseModelsOption } from './loader.js';

describe('config/loader', () => {
  describe('parseModelString', () => {
    it('should parse aliases', () => {
      const result = parseModelString('opus');
      expect(result).toEqual({ provider: 'anthropic', model: 'claude-opus-4-6' });
    });

    it('should parse provider:model format', () => {
      const result = parseModelString('openai:gpt-5');
      expect(result).toEqual({ provider: 'openai', model: 'gpt-5' });
    });

    it('should infer anthropic from claude- prefix', () => {
      const result = parseModelString('claude-sonnet-4');
      expect(result).toEqual({ provider: 'anthropic', model: 'claude-sonnet-4' });
    });

    it('should infer openai from gpt- prefix', () => {
      const result = parseModelString('gpt-4o');
      expect(result).toEqual({ provider: 'openai', model: 'gpt-4o' });
    });

    it('should infer openai from o1 prefix', () => {
      const result = parseModelString('o1');
      expect(result).toEqual({ provider: 'openai', model: 'o1' });
    });

    it('should infer google from gemini- prefix', () => {
      const result = parseModelString('gemini-2.5-pro');
      expect(result).toEqual({ provider: 'google', model: 'gemini-2.5-pro' });
    });

    it('should throw on invalid provider', () => {
      expect(() => parseModelString('invalid:model')).toThrow('Invalid provider "invalid"');
    });

    it('should throw on unparseable string', () => {
      expect(() => parseModelString('unknown-model')).toThrow('Unable to parse model string');
    });
  });

  describe('parseModelsOption', () => {
    it('should parse comma-separated models', () => {
      const result = parseModelsOption('opus,gpt-5,gemini-2.5-pro');
      expect(result).toEqual([
        { provider: 'anthropic', model: 'claude-opus-4-6' },
        { provider: 'openai', model: 'gpt-5' },
        { provider: 'google', model: 'gemini-2.5-pro' },
      ]);
    });

    it('should trim whitespace', () => {
      const result = parseModelsOption(' opus , gpt-5 ');
      expect(result).toEqual([
        { provider: 'anthropic', model: 'claude-opus-4-6' },
        { provider: 'openai', model: 'gpt-5' },
      ]);
    });
  });
});
