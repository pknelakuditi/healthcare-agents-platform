import { describe, expect, it } from 'vitest';
import type { AuditEvent } from '../packages/data/audit/src/index.js';
import type { AuditRepository } from '../packages/data/audit/src/index.js';
import type { ReviewRepository } from '../packages/review/src/index.js';
import type { AgentTask, ReviewDecisionRecord, ReviewRequest } from '../packages/agents/shared/src/index.js';
import { PersistenceError } from '../packages/persistence/src/index.js';
import type { RuntimeConfig } from '../packages/config/src/index.js';
import { buildApp } from '../apps/api/src/app.js';

class FailingAuditRepository implements AuditRepository {
  append<TPayload extends Record<string, unknown>>(_event: AuditEvent<TPayload>): AuditEvent<TPayload> {
    throw new PersistenceError('Failed to append audit event.');
  }

  list(): AuditEvent[] {
    throw new PersistenceError('Failed to load audit events.');
  }
}

class InMemoryReviewRepository implements ReviewRepository {
  private readonly reviews = new Map<string, ReviewRequest>();

  create(task: AgentTask, workflowId: string, reason: string): ReviewRequest {
    const review: ReviewRequest = {
      reviewId: 'review-1',
      requestId: task.requestId,
      task,
      workflowId,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      reason,
    };
    this.reviews.set(review.reviewId, review);
    return review;
  }

  list(): ReviewRequest[] {
    return Array.from(this.reviews.values());
  }

  get(reviewId: string): ReviewRequest | undefined {
    return this.reviews.get(reviewId);
  }

  decide(reviewId: string, status: 'approved' | 'rejected', decision: ReviewDecisionRecord): ReviewRequest {
    const review = this.reviews.get(reviewId);
    if (!review) {
      throw new Error(`Unknown review request: ${reviewId}`);
    }
    const updated = { ...review, status, reviewDecision: decision };
    this.reviews.set(reviewId, updated);
    return updated;
  }
}

const config: RuntimeConfig = {
  nodeEnv: 'test',
  logLevel: 'info',
  apiPort: 3000,
  workerPollIntervalMs: 5000,
  defaultOpenAiModel: 'gpt-5.4',
  openAiApiKey: undefined,
  allowPhiWithOpenAi: false,
  requireHumanApprovalForWrites: true,
  enableMockOpenAi: true,
  persistenceDir: '.runtime/test-persistence',
  authorizedReviewerIds: ['reviewer-1'],
  requireApiAuthentication: false,
  apiAuthenticationMode: 'shared-key',
  apiClients: [],
  allowMockOpenAiInProduction: false,
  trustProxy: false,
  securityHeadersEnabled: true,
  hstsMaxAgeSeconds: 15552000,
  rateLimitingEnabled: true,
  rateLimitWindowMs: 60000,
  rateLimitMaxRequests: 120,
  corsEnabled: false,
  corsAllowedOrigins: [],
  maxRequestSignatureAgeSeconds: 300,
};

describe('persistence boundary', () => {
  it('returns 503 when audit persistence fails during orchestration', async () => {
    const app = buildApp(config, {
      auditRepository: new FailingAuditRepository(),
      reviewRepository: new InMemoryReviewRepository(),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'persist-fail-1',
        userId: 'ops-user',
        useCase: 'document-summary',
        actionType: 'read',
        containsPhi: false,
        message: 'Summarize the document.',
      },
    });

    expect(response.statusCode).toBe(503);
    await app.close();
  });
});
