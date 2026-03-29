export type Effort = 'S' | 'M' | 'L' | 'XL';
export type RiskLevel = 'low' | 'medium' | 'high';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type StepCategory = 'architecture' | 'implementation' | 'testing' | 'infrastructure' | 'design' | 'research';

export interface Step {
  id: string;
  title: string;
  description: string;
  effort: Effort;
  risk: RiskLevel;
  dependencies: string[];
  category: StepCategory;
}

export interface Decision {
  question: string;
  recommendation: string;
  reasoning: string;
  alternatives: string[];
}

export interface Risk {
  description: string;
  severity: Severity;
  mitigation: string;
}

export interface ModelPlan {
  modelName: string;
  summary: string;
  steps: Step[];
  decisions: Decision[];
  risks: Risk[];
  estimatedTotalEffort?: Effort;
  suggestedOrder: string[];
}

export interface ConsensusStep extends Step {
  confidence: number;
  proposedBy: string[];
  variations: Array<{
    modelName: string;
    description: string;
  }>;
}

export interface ConsensusDecision extends Decision {
  confidence: number;
  proposedBy: string[];
  alternativesByModel: Record<string, string[]>;
}

export interface ConsensusRisk extends Risk {
  confidence: number;
  proposedBy: string[];
  severityByModel: Record<string, Severity>;
}

export interface Disagreement {
  topic: string;
  description: string;
  positions: Array<{
    modelName: string;
    stance: string;
  }>;
}

export interface ConsensusPlan {
  summary: string;
  steps: ConsensusStep[];
  decisions: ConsensusDecision[];
  risks: ConsensusRisk[];
  disagreements: Disagreement[];
  suggestedOrder: string[];
  modelPlans: ModelPlan[];
}
