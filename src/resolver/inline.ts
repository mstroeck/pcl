import { PlanInput } from './types.js';

export function resolveInline(text: string): PlanInput {
  return {
    title: text.length > 80 ? text.substring(0, 80) + '...' : text,
    description: text,
    sourceType: 'inline',
  };
}
