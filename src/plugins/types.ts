import { ConsensusPlan } from '../consensus/types.js';
import { PlanRequest, PlanResponse } from '../dispatch/adapter.js';

/**
 * Plugin interface for custom model adapters
 * Allows integrating additional LLM providers (e.g., Ollama, local models)
 */
export interface ModelAdapter {
  /**
   * Unique identifier for this adapter (e.g., 'ollama', 'claude-vertex')
   */
  name: string;

  /**
   * Execute a planning request and return the response
   */
  execute(request: PlanRequest): Promise<PlanResponse>;

  /**
   * Optional: validate adapter configuration on load
   */
  validate?(): Promise<void>;
}

/**
 * Plugin interface for custom output formatters
 * Allows exporting plans in custom formats (e.g., Linear, Jira, Notion)
 */
export interface OutputFormatter {
  /**
   * Unique identifier for this formatter (e.g., 'linear', 'jira')
   */
  name: string;

  /**
   * Format a consensus plan into the target format
   */
  format(plan: ConsensusPlan, options?: Record<string, unknown>): string | Promise<string>;

  /**
   * Optional: file extension for output files
   */
  extension?: string;

  /**
   * Optional: MIME type for HTTP responses
   */
  mimeType?: string;
}

/**
 * Plugin interface for custom input resolvers
 * Allows reading task descriptions from custom sources (e.g., Linear issues, Jira tickets)
 */
export interface InputResolver {
  /**
   * Unique identifier for this resolver (e.g., 'linear', 'jira')
   */
  name: string;

  /**
   * Pattern to match input strings (e.g., /^LIN-\d+$/ for Linear issues)
   */
  pattern: RegExp;

  /**
   * Resolve the input string into a task description
   */
  resolve(input: string): Promise<{
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Plugin interface for custom research providers
 * Allows integrating alternative research sources (e.g., Exa, Tavily)
 */
export interface ResearchProvider {
  /**
   * Unique identifier for this provider (e.g., 'exa', 'tavily')
   */
  name: string;

  /**
   * Conduct research for the given query
   */
  research(query: string, options?: {
    maxTokens?: number;
    model?: string;
  }): Promise<{
    content: string;
    citations?: Array<{
      title: string;
      url: string;
    }>;
  }>;

  /**
   * Optional: estimate cost for a research query
   */
  estimateCost?(query: string): number;
}

/**
 * Union type of all plugin types
 */
export type Plugin = ModelAdapter | OutputFormatter | InputResolver | ResearchProvider;

/**
 * Plugin metadata from config
 */
export interface PluginConfig {
  /**
   * Plugin type
   */
  type: 'model' | 'formatter' | 'resolver' | 'research';

  /**
   * Name/identifier for this plugin instance
   */
  name: string;

  /**
   * Path to plugin module (npm package name or local file path)
   */
  path: string;

  /**
   * Optional configuration passed to the plugin
   */
  options?: Record<string, unknown>;
}

/**
 * Plugin factory function signature
 * Plugins should export a default function that creates the plugin instance
 */
export type PluginFactory<T extends Plugin = Plugin> = (
  options?: Record<string, unknown>
) => T | Promise<T>;
