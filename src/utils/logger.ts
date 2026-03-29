export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

export function debug(message: string, ...args: unknown[]): void {
  if (shouldLog('debug')) {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

export function info(message: string, ...args: unknown[]): void {
  if (shouldLog('info')) {
    console.log(`[INFO] ${message}`, ...args);
  }
}

export function warn(message: string, ...args: unknown[]): void {
  if (shouldLog('warn')) {
    console.warn(`[WARN] ${message}`, ...args);
  }
}

export function error(message: string, ...args: unknown[]): void {
  if (shouldLog('error')) {
    console.error(`[ERROR] ${message}`, ...args);
  }
}

// Format error for display
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

// Get API key instructions for missing keys
export function getAPIKeyInstructions(provider: string): string {
  switch (provider) {
    case 'anthropic':
      return 'Set ANTHROPIC_API_KEY environment variable or add apiKey to model config';
    case 'openai':
    case 'openai-compat':
      return 'Set OPENAI_API_KEY environment variable or add apiKey to model config';
    case 'google':
      return 'Set GOOGLE_API_KEY or GEMINI_API_KEY environment variable or add apiKey to model config';
    case 'perplexity':
      return 'Set PERPLEXITY_API_KEY environment variable or add apiKey to research config';
    default:
      return `Set API key for provider: ${provider}`;
  }
}

// Parse rate limit info from error
export function parseRateLimit(error: Error): { retryAfter?: number; message: string } {
  const message = error.message.toLowerCase();

  // Try to extract retry-after from message
  const retryMatch = message.match(/retry[- ]after[:\s]+(\d+)/i);
  if (retryMatch) {
    return {
      retryAfter: parseInt(retryMatch[1], 10),
      message: 'Rate limit exceeded. Please wait before retrying.',
    };
  }

  // Check for 429 status
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      message: 'Rate limit exceeded. Please wait before retrying.',
    };
  }

  return { message: error.message };
}
