import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { PlanInput, ResolverOptions } from './types.js';
import { parseGitHubReference, resolveGitHubIssue } from './github.js';
import { resolveFile } from './file.js';
import { resolveInline } from './inline.js';

export async function resolve(target: string, options: ResolverOptions = {}): Promise<PlanInput> {
  // Stdin
  if (target === '-') {
    const stdin = await readStdin();
    return {
      title: 'Plan from stdin',
      description: stdin,
      sourceType: 'stdin',
    };
  }

  // GitHub URL (https://github.com/owner/repo/issues/123)
  const urlMatch = target.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  if (urlMatch) {
    return resolveGitHubIssue(urlMatch[1], urlMatch[2], parseInt(urlMatch[3], 10), options.githubToken);
  }

  // GitHub reference (owner/repo#123)
  const ghRef = parseGitHubReference(target);
  if (ghRef) {
    return resolveGitHubIssue(ghRef.owner, ghRef.repo, ghRef.issueNumber, options.githubToken);
  }

  // GitHub issue number only (#123) - requires --repo
  const issueMatch = target.match(/^#(\d+)$/);
  if (issueMatch && options.repo) {
    const [owner, repo] = options.repo.split('/');
    if (owner && repo) {
      return resolveGitHubIssue(owner, repo, parseInt(issueMatch[1], 10), options.githubToken);
    }
  }

  // File path
  if (existsSync(target)) {
    return resolveFile(target);
  }

  // Inline text
  return resolveInline(target);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export * from './types.js';
