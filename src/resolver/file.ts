import { readFile } from 'fs/promises';
import { basename } from 'path';
import { PlanInput } from './types.js';

export async function resolveFile(filePath: string): Promise<PlanInput> {
  const content = await readFile(filePath, 'utf-8');
  const fileName = basename(filePath);

  return {
    title: `Plan from ${fileName}`,
    description: content,
    sourceType: 'file',
    metadata: {
      filePath,
    },
  };
}
