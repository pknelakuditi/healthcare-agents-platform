export type UseCase =
  | 'document-summary'
  | 'intake'
  | 'triage'
  | 'patient-outreach'
  | 'coding-review'
  | 'unknown';

export type ActionType = 'read' | 'write';

export interface AgentTask {
  requestId: string;
  userId: string;
  useCase: UseCase;
  actionType: ActionType;
  containsPhi: boolean;
  message: string;
}

export interface AgentDecision {
  workflow: string;
  assignedAgent: string;
  status: 'accepted' | 'held_for_human_review' | 'rejected';
  rationale: string;
  nextStep: string;
}

export type WorkflowStage =
  | 'policy_check'
  | 'tool_selection'
  | 'document_ingestion'
  | 'fhir_fetch'
  | 'summarization'
  | 'classification'
  | 'human_review'
  | 'execution_ready'
  | 'completed'
  | 'blocked';

export interface ToolPlan {
  toolset: 'documents' | 'fhir';
  operations: string[];
  notes: string;
}

export interface WorkflowPlan {
  workflowId: string;
  stage: WorkflowStage;
  useCaseSummary: string;
  owningAgent: string;
  requiredCapabilities: string[];
  toolPlans: ToolPlan[];
  blockers: string[];
}

export interface WorkflowArtifact {
  kind: 'document' | 'fhir' | 'summary' | 'classification';
  id: string;
  label: string;
  data: Record<string, unknown>;
}

export interface WorkflowStepResult {
  stage: WorkflowStage;
  status: 'completed' | 'skipped';
  summary: string;
}

export interface WorkflowExecution {
  status: 'completed' | 'not_started';
  currentStage: WorkflowStage;
  steps: WorkflowStepResult[];
  artifacts: WorkflowArtifact[];
}

export interface ReviewDecisionRecord {
  reviewerId: string;
  decidedAt: string;
  comments: string;
}

export interface ReviewRequest {
  reviewId: string;
  requestId: string;
  task: AgentTask;
  workflowId: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  reviewDecision?: ReviewDecisionRecord;
}
