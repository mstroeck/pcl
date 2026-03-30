import { ConsensusPlan } from '../consensus/types.js';

export const JSON_SCHEMA_VERSION = '1.0.0';

/**
 * Format consensus plan as versioned JSON
 */
export function formatJSON(plan: ConsensusPlan): string {
  const versioned = {
    version: JSON_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    plan,
  };

  return JSON.stringify(versioned, null, 2);
}
