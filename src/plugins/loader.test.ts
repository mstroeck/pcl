import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { loadPlugin } from './loader.js';
import { PluginConfig } from './types.js';

describe('Plugin Loader', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create temporary directory for test plugins
    testDir = join(tmpdir(), `pcl-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Always clean up the temp directory, even if the test fails
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load a valid model adapter plugin', async () => {
    const pluginPath = join(testDir, 'test-model.js');
    await writeFile(
      pluginPath,
      `
      export default function createPlugin() {
        return {
          name: 'test-model',
          async execute(request) {
            return {
              content: 'test response',
              model: 'test-model',
            };
          },
        };
      }
      `
    );

    const config: PluginConfig = {
      type: 'model',
      name: 'test-model',
      path: pluginPath,
    };

    const plugin = await loadPlugin(config);
    expect(plugin.name).toBe('test-model');
    expect('execute' in plugin).toBe(true);
  });

  it('should load a valid output formatter plugin', async () => {
    const pluginPath = join(testDir, 'test-formatter.js');
    await writeFile(
      pluginPath,
      `
      export default function createPlugin() {
        return {
          name: 'test-formatter',
          format(plan) {
            return 'formatted output';
          },
          extension: 'txt',
        };
      }
      `
    );

    const config: PluginConfig = {
      type: 'formatter',
      name: 'test-formatter',
      path: pluginPath,
    };

    const plugin = await loadPlugin(config);
    expect(plugin.name).toBe('test-formatter');
    expect('format' in plugin).toBe(true);
  });

  it('should load a valid input resolver plugin', async () => {
    const pluginPath = join(testDir, 'test-resolver.js');
    await writeFile(
      pluginPath,
      `
      export default function createPlugin() {
        return {
          name: 'test-resolver',
          pattern: /^TEST-\\d+$/,
          async resolve(input) {
            return {
              title: 'Test Issue',
              description: 'Test description',
            };
          },
        };
      }
      `
    );

    const config: PluginConfig = {
      type: 'resolver',
      name: 'test-resolver',
      path: pluginPath,
    };

    const plugin = await loadPlugin(config);
    expect(plugin.name).toBe('test-resolver');
    expect('pattern' in plugin).toBe(true);
    expect('resolve' in plugin).toBe(true);
  });

  it('should load a valid research provider plugin', async () => {
    const pluginPath = join(testDir, 'test-research.js');
    await writeFile(
      pluginPath,
      `
      export default function createPlugin() {
        return {
          name: 'test-research',
          async research(query) {
            return {
              content: 'research results',
              citations: [],
            };
          },
        };
      }
      `
    );

    const config: PluginConfig = {
      type: 'research',
      name: 'test-research',
      path: pluginPath,
    };

    const plugin = await loadPlugin(config);
    expect(plugin.name).toBe('test-research');
    expect('research' in plugin).toBe(true);
  });

  it('should pass options to plugin factory', async () => {
    const pluginPath = join(testDir, 'test-options.js');
    await writeFile(
      pluginPath,
      `
      export default function createPlugin(options) {
        return {
          name: 'test-options',
          format(plan) {
            return options.prefix + ' formatted';
          },
        };
      }
      `
    );

    const config: PluginConfig = {
      type: 'formatter',
      name: 'test-options',
      path: pluginPath,
      options: { prefix: 'custom' },
    };

    const plugin = await loadPlugin(config);
    expect(plugin.name).toBe('test-options');

    if ('format' in plugin) {
      const result = await plugin.format({} as any);
      expect(result).toBe('custom formatted');
    }
  });

  it('should throw error for missing plugin file', async () => {
    const config: PluginConfig = {
      type: 'model',
      name: 'missing',
      path: './nonexistent-plugin.js',
    };

    await expect(loadPlugin(config)).rejects.toThrow('Plugin file not found');
  });

  it('should throw error for plugin without default export', async () => {
    const pluginPath = join(testDir, 'no-export.js');
    await writeFile(
      pluginPath,
      `
      export const notDefault = () => ({ name: 'test' });
      `
    );

    const config: PluginConfig = {
      type: 'model',
      name: 'no-export',
      path: pluginPath,
    };

    await expect(loadPlugin(config)).rejects.toThrow('must export a default function');
  });
});
