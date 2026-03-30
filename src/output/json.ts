import { ConsensusPlan } from '../consensus/types.js';

export const JSON_SCHEMA_VERSION = '1.0.0';

/**
 * Format consensus plan as versioned JSON
 * @param generatedAt Optional ISO timestamp; defaults to now. Pass a fixed value for deterministic output.
 */
export function formatJSON(plan: ConsensusPlan, generatedAt?: string): string {
  const versioned = {
    version: JSON_SCHEMA_VERSION,
    generatedAt: generatedAt ?? new Date().toISOString(),
    plan,
  };

  return JSON.stringify(versioned, null, 2);
}
