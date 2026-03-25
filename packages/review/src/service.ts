import type { RuntimeConfig } from '../../config/src/index.js';
import type { WorkflowResult } from '../../orchestration/src/index.js';
import { evaluateTaskPolicy } from '../../safety/src/index.js';
import type { AgentTask, ReviewRequest } from '../../agents/shared/src/index.js';
import { FileReviewStore } from './store.js';
import { runWorkflow } from '../../orchestration/src/index.js';

export class ReviewQueueService {
  constructor(
    private readonly reviewStore: FileReviewStore,
    private readonly config: RuntimeConfig
  ) {}

  enqueue(task: AgentTask, result: WorkflowResult): ReviewRequest {
    return this.reviewStore.create(
      task,
      result.plan.workflowId,
      result.decision.rationale
    );
  }

  list(): ReviewRequest[] {
    return this.reviewStore.list();
  }

  get(reviewId: string): ReviewRequest | undefined {
    return this.reviewStore.get(reviewId);
  }

  approve(reviewId: string, reviewerId: string, comments: string) {
    const review = this.reviewStore.decide(reviewId, 'approved', {
      reviewerId,
      decidedAt: new Date().toISOString(),
      comments,
    });

    const approvalBypassPolicy = {
      ...evaluateTaskPolicy(review.task, this.config),
      requiresHumanApproval: false,
      reason: 'Human review approved the write request.',
    };

    return {
      review,
      result: runWorkflow(review.task, approvalBypassPolicy, this.config),
    };
  }

  reject(reviewId: string, reviewerId: string, comments: string) {
    const review = this.reviewStore.decide(reviewId, 'rejected', {
      reviewerId,
      decidedAt: new Date().toISOString(),
      comments,
    });

    return { review };
  }
}
