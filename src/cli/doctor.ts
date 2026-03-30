import chalk from 'chalk';
import { AnthropicAdapter } from '../dispatch/anthropic.js';
import { OpenAIAdapter } from '../dispatch/openai.js';
import { GoogleAdapter } from '../dispatch/google.js';

interface DoctorResult {
  provider: string;
  status: 'ok' | 'error' | 'missing';
  message: string;
  models?: string[];
}

/**
 * Run diagnostic checks on API keys and provider connectivity
 */
export async function runDoctor(): Promise<void> {
  console.log(chalk.bold.blue('🔍 Plan Council Doctor\n'));
  console.log('Checking API keys and provider connectivity...\n');

  const results: DoctorResult[] = [];

  // Check Anthropic
  results.push(await checkAnthropic());

  // Check OpenAI
  results.push(await checkOpenAI());

  // Check Google
  results.push(await checkGoogle());

  // Check Perplexity (for research)
  results.push(await checkPerplexity());

  // Print results
  console.log(chalk.bold('Results:\n'));

  for (const result of results) {
    const icon = result.status === 'ok' ? '✓' : result.status === 'missing' ? '○' : '✗';
    const color = result.status === 'ok' ? chalk.green : result.status === 'missing' ? chalk.gray : chalk.red;

    console.log(color(`${icon} ${result.provider}: ${result.message}`));

    if (result.models && result.models.length > 0) {
      console.log(color(`  Available models: ${result.models.join(', ')}`));
    }

    console.log();
  }

  // Summary
  const okCount = results.filter((r) => r.status === 'ok').length;
  const errorCount = results.filter((r) => r.status === 'error').length;
  const missingCount = results.filter((r) => r.status === 'missing').length;

  console.log(chalk.bold('Summary:'));
  console.log(chalk.green(`  ${okCount} provider(s) ready`));
  if (errorCount > 0) {
    console.log(chalk.red(`  ${errorCount} provider(s) with errors`));
  }
  if (missingCount > 0) {
    console.log(chalk.gray(`  ${missingCount} provider(s) not configured`));
  }

  console.log();

  if (okCount === 0) {
    console.log(chalk.red('⚠️  No providers are available. Set at least one API key to use Plan Council.'));
    console.log();
    console.log('Set API keys via environment variables:');
    console.log('  export ANTHROPIC_API_KEY=your-key');
    console.log('  export OPENAI_API_KEY=your-key');
    console.log('  export GOOGLE_API_KEY=your-key');
  } else {
    console.log(chalk.green('✓ Ready to plan!'));
  }
}

async function checkAnthropic(): Promise<DoctorResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      provider: 'Anthropic',
      status: 'missing',
      message: 'API key not set (ANTHROPIC_API_KEY)',
    };
  }

  try {
    // Try to create adapter and make a minimal test call
    const adapter = new AnthropicAdapter(apiKey, 'claude-3-haiku-20240307');

    // Test with minimal input
    await adapter.execute({
      systemPrompt: 'You are a test.',
      userPrompt: 'Say "ok"',
      maxTokens: 10,
      timeout: 10000,
    });

    return {
      provider: 'Anthropic',
      status: 'ok',
      message: 'Connected successfully',
      // Known models as of 2026; update when new models are released.
      models: ['claude-opus-4-6', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    };
  } catch (error) {
    return {
      provider: 'Anthropic',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkOpenAI(): Promise<DoctorResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      provider: 'OpenAI',
      status: 'missing',
      message: 'API key not set (OPENAI_API_KEY)',
    };
  }

  try {
    const adapter = new OpenAIAdapter(apiKey, 'gpt-4o-mini');

    await adapter.execute({
      systemPrompt: 'You are a test.',
      userPrompt: 'Say "ok"',
      maxTokens: 10,
      timeout: 10000,
    });

    return {
      provider: 'OpenAI',
      status: 'ok',
      message: 'Connected successfully',
      // Known models as of 2026; update when new models are released.
      models: ['gpt-5.4', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o1-mini', 'o3-mini'],
    };
  } catch (error) {
    return {
      provider: 'OpenAI',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkGoogle(): Promise<DoctorResult> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      provider: 'Google',
      status: 'missing',
      message: 'API key not set (GOOGLE_API_KEY or GEMINI_API_KEY)',
    };
  }

  try {
    const adapter = new GoogleAdapter(apiKey, 'gemini-2.0-flash-exp');

    await adapter.execute({
      systemPrompt: 'You are a test.',
      userPrompt: 'Say "ok"',
      maxTokens: 10,
      timeout: 10000,
    });

    return {
      provider: 'Google',
      status: 'ok',
      message: 'Connected successfully',
      // Known models as of 2026; update when new models are released.
      models: ['gemini-2.5-pro-exp-03-25', 'gemini-2.0-flash-thinking-exp-01-21', 'gemini-2.0-flash-exp'],
    };
  } catch (error) {
    return {
      provider: 'Google',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkPerplexity(): Promise<DoctorResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return {
      provider: 'Perplexity (Research)',
      status: 'missing',
      message: 'API key not set (PERPLEXITY_API_KEY) - research feature unavailable',
    };
  }

  try {
    // Perplexity uses OpenAI-compatible API
    const adapter = new OpenAIAdapter(apiKey, 'sonar', 'https://api.perplexity.ai');

    await adapter.execute({
      systemPrompt: 'You are a test.',
      userPrompt: 'Say "ok"',
      maxTokens: 10,
      timeout: 10000,
    });

    return {
      provider: 'Perplexity (Research)',
      status: 'ok',
      message: 'Connected successfully',
      // Known models as of 2026; update when new models are released.
      models: ['sonar-deep-research', 'sonar-reasoning', 'sonar'],
    };
  } catch (error) {
    return {
      provider: 'Perplexity (Research)',
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
