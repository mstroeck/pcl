import { ConsensusPlan } from '../consensus/types.js';

export function formatJSON(plan: ConsensusPlan): string {
  return JSON.stringify(plan, null, 2);
}
