import type { AgentTask, ReviewDecisionRecord, ReviewRequest } from '../../agents/shared/src/index.js';

export interface ReviewRepository {
  create(task: AgentTask, workflowId: string, reason: string): ReviewRequest;
  list(): ReviewRequest[];
  get(reviewId: string): ReviewRequest | undefined;
  decide(reviewId: string, status: 'approved' | 'rejected', decision: ReviewDecisionRecord): ReviewRequest;
}
