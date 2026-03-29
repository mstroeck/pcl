import { Octokit } from '@octokit/rest';
import { PlanInput } from './types.js';

export async function resolveGitHubIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  token?: string
): Promise<PlanInput> {
  const octokit = new Octokit({ auth: token });

  const { data: issue } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  // Fetch comments
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  });

  let description = issue.body || '';

  if (comments.length > 0) {
    description += '\n\n## Comments\n\n';
    for (const comment of comments) {
      description += `**${comment.user?.login}**: ${comment.body}\n\n`;
    }
  }

  return {
    title: issue.title,
    description,
    sourceType: 'github',
    metadata: {
      owner,
      repo,
      issueNumber,
      url: issue.html_url,
      labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name)).filter((name): name is string => name !== undefined),
      state: issue.state,
    },
  };
}

export function parseGitHubReference(ref: string): { owner: string; repo: string; issueNumber: number } | null {
  // owner/repo#123
  const match = ref.match(/^([^/]+)\/([^#]+)#(\d+)$/);
  if (match) {
    return {
      owner: match[1],
      repo: match[2],
      issueNumber: parseInt(match[3], 10),
    };
  }
  return null;
}
