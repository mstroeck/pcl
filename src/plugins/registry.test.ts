import { describe, it, expect, beforeEach } from 'vitest';
import { pluginRegistry } from './registry.js';
import { ModelAdapter, OutputFormatter, InputResolver, ResearchProvider } from './types.js';

describe('Plugin Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    pluginRegistry.clear();
  });

  it('should register and retrieve model adapter', () => {
    const adapter: ModelAdapter = {
      name: 'test-model',
      async execute(request) {
        return { content: 'test', model: 'test' };
      },
    };

    pluginRegistry.register(adapter);

    const retrieved = pluginRegistry.getModelAdapter('test-model');
    expect(retrieved).toBe(adapter);
    expect(pluginRegistry.getAllModelAdapters()).toHaveLength(1);
  });

  it('should register and retrieve output formatter', () => {
    const formatter: OutputFormatter = {
      name: 'test-formatter',
      format(plan) {
        return 'formatted';
      },
    };

    pluginRegistry.register(formatter);

    const retrieved = pluginRegistry.getOutputFormatter('test-formatter');
    expect(retrieved).toBe(formatter);
    expect(pluginRegistry.getAllOutputFormatters()).toHaveLength(1);
  });

  it('should register and retrieve input resolver', () => {
    const resolver: InputResolver = {
      name: 'test-resolver',
      pattern: /^TEST-\d+$/,
      async resolve(input) {
        return { title: 'Test', description: 'Desc' };
      },
    };

    pluginRegistry.register(resolver);

    const retrieved = pluginRegistry.getInputResolver('test-resolver');
    expect(retrieved).toBe(resolver);
    expect(pluginRegistry.getAllInputResolvers()).toHaveLength(1);
  });

  it('should register and retrieve research provider', () => {
    const provider: ResearchProvider = {
      name: 'test-research',
      async research(query) {
        return { content: 'research' };
      },
    };

    pluginRegistry.register(provider);

    const retrieved = pluginRegistry.getResearchProvider('test-research');
    expect(retrieved).toBe(provider);
    expect(pluginRegistry.getAllResearchProviders()).toHaveLength(1);
  });

  it('should register multiple plugins', () => {
    const adapter: ModelAdapter = {
      name: 'model1',
      async execute(request) {
        return { content: 'test', model: 'test' };
      },
    };

    const formatter: OutputFormatter = {
      name: 'formatter1',
      format(plan) {
        return 'formatted';
      },
    };

    pluginRegistry.registerAll([adapter, formatter]);

    expect(pluginRegistry.getAllModelAdapters()).toHaveLength(1);
    expect(pluginRegistry.getAllOutputFormatters()).toHaveLength(1);
  });

  it('should try to resolve input using registered resolvers', async () => {
    const resolver1: InputResolver = {
      name: 'linear',
      pattern: /^LIN-\d+$/,
      async resolve(input) {
        return { title: 'Linear Issue', description: 'From Linear' };
      },
    };

    const resolver2: InputResolver = {
      name: 'jira',
      pattern: /^[A-Z]+-\d+$/,
      async resolve(input) {
        return { title: 'JIRA Issue', description: 'From JIRA' };
      },
    };

    pluginRegistry.registerAll([resolver1, resolver2]);

    // Should match resolver1
    const result1 = await pluginRegistry.tryResolveInput('LIN-123');
    expect(result1?.title).toBe('Linear Issue');

    // Should match resolver2
    const result2 = await pluginRegistry.tryResolveInput('ABC-456');
    expect(result2?.title).toBe('JIRA Issue');

    // Should not match any resolver
    const result3 = await pluginRegistry.tryResolveInput('invalid-input');
    expect(result3).toBeNull();
  });

  it('should return plugin counts', () => {
    const adapter: ModelAdapter = {
      name: 'model1',
      async execute(request) {
        return { content: 'test', model: 'test' };
      },
    };

    const formatter: OutputFormatter = {
      name: 'formatter1',
      format(plan) {
        return 'formatted';
      },
    };

    pluginRegistry.registerAll([adapter, formatter]);

    const counts = pluginRegistry.getPluginCount();
    expect(counts.total).toBe(2);
    expect(counts.modelAdapters).toBe(1);
    expect(counts.outputFormatters).toBe(1);
    expect(counts.inputResolvers).toBe(0);
    expect(counts.researchProviders).toBe(0);
  });

  it('should clear all plugins', () => {
    const adapter: ModelAdapter = {
      name: 'model1',
      async execute(request) {
        return { content: 'test', model: 'test' };
      },
    };

    pluginRegistry.register(adapter);
    expect(pluginRegistry.getAllModelAdapters()).toHaveLength(1);

    pluginRegistry.clear();
    expect(pluginRegistry.getAllModelAdapters()).toHaveLength(0);
    expect(pluginRegistry.getPluginCount().total).toBe(0);
  });

  it('should return undefined for unregistered plugins', () => {
    expect(pluginRegistry.getModelAdapter('nonexistent')).toBeUndefined();
    expect(pluginRegistry.getOutputFormatter('nonexistent')).toBeUndefined();
    expect(pluginRegistry.getInputResolver('nonexistent')).toBeUndefined();
    expect(pluginRegistry.getResearchProvider('nonexistent')).toBeUndefined();
  });
});
