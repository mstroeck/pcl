import { existsSync, realpathSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve as resolvePath, sep as pathSep } from 'path';
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
  // Design decision: Regex intentionally rejects URLs with extra path segments beyond /issues/123
  // This ensures we only match direct issue URLs, not comment or other sub-resources
  // Query strings (?...) and fragments (#...) are allowed via (?:[?#].*)?
  const urlMatch = target.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)\/?(?:[?#].*)?$/);
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
    if (!owner || !repo || options.repo.split('/').length !== 2) {
      throw new Error(`Invalid repo format "${options.repo}". Expected format: owner/repo`);
    }
    return resolveGitHubIssue(owner, repo, parseInt(issueMatch[1], 10), options.githubToken);
  }

  // File path
  if (existsSync(target)) {
    // Validate file path is within cwd (prevent path traversal, including symlinks)
    // Use realpathSync to resolve symlinks before comparison
    const absolutePath = realpathSync(resolvePath(target));
    const cwd = realpathSync(process.cwd());

    if (!absolutePath.startsWith(cwd + pathSep) && absolutePath !== cwd) {
      throw new Error(`File path "${target}" is outside current working directory`);
    }

    return resolveFile(target);
  }

  // Inline text
  return resolveInline(target);
}

async function readStdin(): Promise<string> {
  // Check if stdin is a TTY (interactive terminal)
  if (process.stdin.isTTY) {
    throw new Error('No input provided. Pipe data to stdin or provide a target argument.');
  }

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

export * from './types.js';
