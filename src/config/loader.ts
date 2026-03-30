import { cosmiconfig } from 'cosmiconfig';
import { PlanCouncilConfig, PlanCouncilConfigSchema, ModelConfig } from './schema.js';
import { getDefaultModels, MODEL_ALIASES } from './defaults.js';
import { loadPlugins, pluginRegistry } from '../plugins/index.js';

const explorer = cosmiconfig('plan-council');

export async function loadConfig(overrides?: Partial<PlanCouncilConfig>): Promise<PlanCouncilConfig> {
  let config: Partial<PlanCouncilConfig> = {};

  try {
    const result = await explorer.search();
    if (result) {
      config = result.config;
    }
    // If result is null/undefined, no config file found - this is fine, no warning needed
  } catch (error) {
    // Only warn on actual parse errors (not missing file)
    console.error('Warning: Failed to parse config file:', error instanceof Error ? error.message : String(error));
  }

  // Merge with overrides
  const merged = {
    ...config,
    ...overrides,
    models: overrides?.models || config.models || getDefaultModels(),
  };

  // Validate and return
  const validated = PlanCouncilConfigSchema.parse(merged);

  // Load plugins if specified in config
  if (validated.plugins && validated.plugins.length > 0) {
    try {
      const plugins = await loadPlugins(validated.plugins);
      pluginRegistry.registerAll(plugins);
    } catch (error) {
      console.error('Warning: Failed to load plugins:', error instanceof Error ? error.message : String(error));
    }
  }

  return validated;
}

const VALID_PROVIDERS = ['anthropic', 'openai', 'google', 'openai-compat'] as const;

function isValidProvider(provider: string): provider is 'anthropic' | 'openai' | 'google' | 'openai-compat' {
  return (VALID_PROVIDERS as readonly string[]).includes(provider);
}

export function parseModelString(modelString: string): ModelConfig {
  const alias = MODEL_ALIASES[modelString];

  if (alias) {
    if (!isValidProvider(alias.provider)) {
      throw new Error(`Invalid provider in alias "${modelString}": ${alias.provider}`);
    }
    return {
      provider: alias.provider as 'anthropic' | 'openai' | 'google' | 'openai-compat',
      model: alias.model,
    };
  }

  // Parse provider:model format
  if (modelString.includes(':')) {
    const [provider, model] = modelString.split(':', 2);
    if (!isValidProvider(provider)) {
      throw new Error(`Invalid provider "${provider}". Valid providers: ${VALID_PROVIDERS.join(', ')}`);
    }
    return {
      provider,
      model,
    };
  }

  // Infer provider from model name
  if (modelString.startsWith('claude-')) {
    return { provider: 'anthropic', model: modelString };
  }
  if (modelString.startsWith('gpt-') || modelString.startsWith('o1') || modelString.startsWith('o3')) {
    return { provider: 'openai', model: modelString };
  }
  if (modelString.startsWith('gemini-')) {
    return { provider: 'google', model: modelString };
  }

  throw new Error(`Unable to parse model string: ${modelString}`);
}

export function parseModelsOption(modelsString: string): ModelConfig[] {
  return modelsString.split(',').map(m => parseModelString(m.trim()));
}
