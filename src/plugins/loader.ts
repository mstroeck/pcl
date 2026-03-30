import { pathToFileURL } from 'url';
import { resolve as resolvePath, isAbsolute } from 'path';
import { existsSync } from 'fs';
import { Plugin, PluginConfig, PluginFactory } from './types.js';

/**
 * Load a plugin from a module path
 * Supports both npm packages and local file paths
 */
export async function loadPlugin(config: PluginConfig): Promise<Plugin> {
  const modulePath = resolvePluginPath(config.path);

  try {
    // Dynamic import the plugin module
    const module = await import(modulePath);

    // Get the plugin factory (default export or named export)
    const factory: PluginFactory | undefined = module.default || module[config.name];

    if (!factory) {
      throw new Error(
        `Plugin at ${modulePath} must export a default function or a named export matching '${config.name}'`
      );
    }

    if (typeof factory !== 'function') {
      throw new Error(
        `Plugin at ${modulePath} must export a function, got ${typeof factory}`
      );
    }

    // Create plugin instance
    const plugin = await factory(config.options);

    // Validate plugin has required properties
    validatePlugin(plugin, config.type);

    // Optional: run plugin validation
    if ('validate' in plugin && typeof plugin.validate === 'function') {
      await plugin.validate();
    }

    return plugin;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load plugin '${config.name}' from ${modulePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Resolve plugin path to a valid module specifier
 */
function resolvePluginPath(path: string): string {
  // If it's an absolute path or starts with ./ or ../, treat as local file
  if (isAbsolute(path) || path.startsWith('./') || path.startsWith('../')) {
    const absolutePath = isAbsolute(path) ? path : resolvePath(process.cwd(), path);

    if (!existsSync(absolutePath)) {
      throw new Error(`Plugin file not found: ${absolutePath}`);
    }

    // Convert to file:// URL for ESM import
    return pathToFileURL(absolutePath).href;
  }

  // Otherwise, treat as npm package name
  return path;
}

/**
 * Validate that a plugin has the required properties for its type
 */
function validatePlugin(plugin: unknown, type: PluginConfig['type']): asserts plugin is Plugin {
  if (typeof plugin !== 'object' || plugin === null) {
    throw new Error('Plugin must be an object');
  }

  const obj = plugin as Record<string, unknown>;

  if (typeof obj.name !== 'string') {
    throw new Error('Plugin must have a "name" property of type string');
  }

  switch (type) {
    case 'model':
      if (typeof obj.execute !== 'function') {
        throw new Error('ModelAdapter plugin must have an "execute" method');
      }
      break;

    case 'formatter':
      if (typeof obj.format !== 'function') {
        throw new Error('OutputFormatter plugin must have a "format" method');
      }
      break;

    case 'resolver':
      if (!(obj.pattern instanceof RegExp)) {
        throw new Error('InputResolver plugin must have a "pattern" property of type RegExp');
      }
      if (typeof obj.resolve !== 'function') {
        throw new Error('InputResolver plugin must have a "resolve" method');
      }
      break;

    case 'research':
      if (typeof obj.research !== 'function') {
        throw new Error('ResearchProvider plugin must have a "research" method');
      }
      break;

    default:
      throw new Error(`Unknown plugin type: ${type}`);
  }
}

/**
 * Load multiple plugins in parallel
 */
export async function loadPlugins(configs: PluginConfig[]): Promise<Plugin[]> {
  return Promise.all(configs.map(loadPlugin));
}
