import {
  Plugin,
  ModelAdapter,
  OutputFormatter,
  InputResolver,
  ResearchProvider,
} from './types.js';

/**
 * Global plugin registry.
 * Stores loaded plugins by type and name.
 *
 * This is a module-level singleton. Call `clear()` between test cases or
 * whenever you need to reset state (e.g. to avoid cross-test pollution).
 */
class PluginRegistry {
  private modelAdapters = new Map<string, ModelAdapter>();
  private outputFormatters = new Map<string, OutputFormatter>();
  private inputResolvers = new Map<string, InputResolver>();
  private researchProviders = new Map<string, ResearchProvider>();

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    if (this.isModelAdapter(plugin)) {
      this.modelAdapters.set(plugin.name, plugin);
    } else if (this.isOutputFormatter(plugin)) {
      this.outputFormatters.set(plugin.name, plugin);
    } else if (this.isInputResolver(plugin)) {
      this.inputResolvers.set(plugin.name, plugin);
    } else if (this.isResearchProvider(plugin)) {
      this.researchProviders.set(plugin.name, plugin);
    } else {
      throw new Error(`Unknown plugin type for plugin: ${(plugin as { name?: string }).name || 'unknown'}`);
    }
  }

  /**
   * Register multiple plugins
   */
  registerAll(plugins: Plugin[]): void {
    plugins.forEach((plugin) => this.register(plugin));
  }

  /**
   * Get a model adapter by name
   */
  getModelAdapter(name: string): ModelAdapter | undefined {
    return this.modelAdapters.get(name);
  }

  /**
   * Get all registered model adapters
   */
  getAllModelAdapters(): ModelAdapter[] {
    return Array.from(this.modelAdapters.values());
  }

  /**
   * Get an output formatter by name
   */
  getOutputFormatter(name: string): OutputFormatter | undefined {
    return this.outputFormatters.get(name);
  }

  /**
   * Get all registered output formatters
   */
  getAllOutputFormatters(): OutputFormatter[] {
    return Array.from(this.outputFormatters.values());
  }

  /**
   * Get an input resolver by name
   */
  getInputResolver(name: string): InputResolver | undefined {
    return this.inputResolvers.get(name);
  }

  /**
   * Get all registered input resolvers
   */
  getAllInputResolvers(): InputResolver[] {
    return Array.from(this.inputResolvers.values());
  }

  /**
   * Try to resolve input using all registered resolvers
   */
  async tryResolveInput(input: string): Promise<{
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  } | null> {
    for (const resolver of this.inputResolvers.values()) {
      if (resolver.pattern.test(input)) {
        try {
          return await resolver.resolve(input);
        } catch (error) {
          // Continue to next resolver if this one fails
          console.warn(`Resolver ${resolver.name} failed for input '${input}':`, error);
          continue;
        }
      }
    }
    return null;
  }

  /**
   * Get a research provider by name
   */
  getResearchProvider(name: string): ResearchProvider | undefined {
    return this.researchProviders.get(name);
  }

  /**
   * Get all registered research providers
   */
  getAllResearchProviders(): ResearchProvider[] {
    return Array.from(this.researchProviders.values());
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.modelAdapters.clear();
    this.outputFormatters.clear();
    this.inputResolvers.clear();
    this.researchProviders.clear();
  }

  /**
   * Get total count of registered plugins
   */
  getPluginCount(): {
    total: number;
    modelAdapters: number;
    outputFormatters: number;
    inputResolvers: number;
    researchProviders: number;
  } {
    return {
      total:
        this.modelAdapters.size +
        this.outputFormatters.size +
        this.inputResolvers.size +
        this.researchProviders.size,
      modelAdapters: this.modelAdapters.size,
      outputFormatters: this.outputFormatters.size,
      inputResolvers: this.inputResolvers.size,
      researchProviders: this.researchProviders.size,
    };
  }

  // Type guards: prefer the explicit `pluginType` discriminator injected by the
  // loader over duck typing, which can misclassify plugins that implement
  // multiple interfaces.
  private isModelAdapter(plugin: Plugin): plugin is ModelAdapter {
    const pt = (plugin as { pluginType?: string }).pluginType;
    if (pt !== undefined) return pt === 'model';
    return 'execute' in plugin;
  }

  private isOutputFormatter(plugin: Plugin): plugin is OutputFormatter {
    const pt = (plugin as { pluginType?: string }).pluginType;
    if (pt !== undefined) return pt === 'formatter';
    return 'format' in plugin;
  }

  private isInputResolver(plugin: Plugin): plugin is InputResolver {
    const pt = (plugin as { pluginType?: string }).pluginType;
    if (pt !== undefined) return pt === 'resolver';
    return 'pattern' in plugin && 'resolve' in plugin;
  }

  private isResearchProvider(plugin: Plugin): plugin is ResearchProvider {
    const pt = (plugin as { pluginType?: string }).pluginType;
    if (pt !== undefined) return pt === 'research';
    return 'research' in plugin;
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
