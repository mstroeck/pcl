export interface PlanRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface PlanResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  error?: string;
  cached?: boolean;
}

export interface ModelAdapter {
  execute(request: PlanRequest): Promise<PlanResponse>;
}
