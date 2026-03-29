import { cosmiconfig } from 'cosmiconfig';
import { PlanCouncilConfig, PlanCouncilConfigSchema, ModelConfig } from './schema.js';
import { getDefaultModels, MODEL_ALIASES } from './defaults.js';

const explorer = cosmiconfig('plan-council');

export async function loadConfig(overrides?: Partial<PlanCouncilConfig>): Promise<PlanCouncilConfig> {
  let config: Partial<PlanCouncilConfig> = {};

  try {
    const result = await explorer.search();
    if (result) {
      config = result.config;
    }
  } catch (error) {
    // Config file not found or invalid, use defaults
  }

  // Merge with overrides
  const merged = {
    ...config,
    ...overrides,
    models: overrides?.models || config.models || getDefaultModels(),
  };

  // Validate and return
  return PlanCouncilConfigSchema.parse(merged);
}

export function parseModelString(modelString: string): ModelConfig {
  const alias = MODEL_ALIASES[modelString];

  if (alias) {
    return {
      provider: alias.provider as 'anthropic' | 'openai' | 'google' | 'openai-compat',
      model: alias.model,
    };
  }

  // Parse provider:model format
  if (modelString.includes(':')) {
    const [provider, model] = modelString.split(':', 2);
    return {
      provider: provider as 'anthropic' | 'openai' | 'google' | 'openai-compat',
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
