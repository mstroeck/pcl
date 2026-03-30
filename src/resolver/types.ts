export type SourceType = 'github' | 'file' | 'inline' | 'stdin' | 'url' | 'plugin';

export interface PlanInput {
  title: string;
  description: string;
  sourceType: SourceType;
  metadata?: {
    owner?: string;
    repo?: string;
    issueNumber?: number;
    filePath?: string;
    url?: string;
    [key: string]: any;
  };
}

export interface ResolverOptions {
  githubToken?: string;
  repo?: string;
}
