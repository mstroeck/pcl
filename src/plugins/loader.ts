import { pathToFileURL } from 'url';
import { resolve as resolvePath, isAbsolute, sep as pathSep } from 'path';
import { existsSync } from 'fs';
import { Plugin, PluginConfig, PluginFactory } from './types.js';
import { setPluginType } from './plugin-type-map.js';

/**
 * Load a plugin from a module path.
 * Supports both npm packages and local file paths.
 *
 * SECURITY: Only load plugins from trusted sources. Local paths are resolved
 * relative to the current working directory and must exist on disk. npm package
 * names are validated against a safe allowlist pattern (no shell metacharacters,
 * no path traversal sequences). Running untrusted third-party plugins carries
 * the same risk as executing arbitrary code.
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

    // Record the plugin type in a WeakMap so the registry can classify it
    // reliably without mutating the plugin object or relying on duck typing.
    setPluginType(plugin, config.type);

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
 * Resolve plugin path to a valid module specifier.
 *
 * SECURITY: Local file paths (absolute or relative) are restricted to the
 * node_modules/ and plugins/ directories within the current working directory.
 * This prevents accidental loading of arbitrary system files and limits the
 * blast radius of a misconfigured plugin path.  npm package names are
 * validated separately by validateNpmPackageName().
 */
function resolvePluginPath(path: string): string {
  // If it's an absolute path or starts with ./ or ../, treat as local file
  if (isAbsolute(path) || path.startsWith('./') || path.startsWith('../')) {
    const absolutePath = isAbsolute(path) ? path : resolvePath(process.cwd(), path);

    // Restrict local plugins to node_modules/ or plugins/ within cwd.
    const cwd = process.cwd();
    const nodeModulesDir = resolvePath(cwd, 'node_modules') + pathSep;
    const pluginsDir = resolvePath(cwd, 'plugins') + pathSep;
    if (!absolutePath.startsWith(nodeModulesDir) && !absolutePath.startsWith(pluginsDir)) {
      throw new Error(
        `Plugin path "${path}" is outside allowed directories. ` +
        `Local plugins must reside in node_modules/ or plugins/ within the working directory.`
      );
    }

    if (!existsSync(absolutePath)) {
      throw new Error(`Plugin file not found: ${absolutePath}`);
    }

    // Convert to file:// URL for ESM import
    return pathToFileURL(absolutePath).href;
  }

  // Otherwise, treat as npm package name — validate it is a safe package name
  // to prevent path traversal or shell injection via crafted package names.
  validateNpmPackageName(path);
  return path;
}

/**
 * Validate that a string is a safe npm package name.
 * Accepts plain names and scoped packages (@scope/name).
 */
function validateNpmPackageName(name: string): void {
  // Scoped: @scope/package or unscoped: package-name
  // Allow lowercase letters, digits, hyphens, underscores, dots.
  if (!/^(@[a-z0-9-_.]+\/)?[a-z0-9-_.]+$/.test(name)) {
    throw new Error(
      `Invalid plugin package name: "${name}". Must be a valid npm package name (lowercase letters, digits, hyphens, underscores, dots; optionally scoped as @scope/name).`
    );
  }
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
