export interface ResearchRequest {
  query: string;
  maxTokens?: number;
}

export interface ResearchResponse {
  content: string;
  citations?: string[];
  provider: string;
  model: string;
}

export interface ResearchProvider {
  execute(request: ResearchRequest): Promise<ResearchResponse>;
}
