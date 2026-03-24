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
