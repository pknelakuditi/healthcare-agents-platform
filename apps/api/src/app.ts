import Fastify from 'fastify';
import { z } from 'zod';
import { getRuntimeConfig, type RuntimeConfig } from '../../../packages/config/src/index.js';
import { createLogger } from '../../../packages/observability/src/index.js';
import { routeAgentTask } from '../../../packages/agents/orchestrator/src/index.js';
import { createAuditEvent, FileAuditStore } from '../../../packages/data/audit/src/index.js';
import { getOpenAiClientStatus } from '../../../packages/ai/openai/src/index.js';
import { listUseCaseDefinitions } from '../../../packages/use-cases/src/index.js';
import { FileReviewStore } from '../../../packages/review/src/index.js';
import { ReviewQueueService } from '../../../packages/review/src/service.js';
import { ReviewerAuthorizationError } from '../../../packages/auth/src/index.js';
import { runEvaluations } from '../../../packages/evals/src/index.js';

const orchestrateBodySchema = z.object({
  requestId: z.string().min(1),
  userId: z.string().min(1),
  useCase: z.enum([
    'document-summary',
    'intake',
    'triage',
    'patient-outreach',
    'coding-review',
    'unknown',
  ]),
  actionType: z.enum(['read', 'write']),
  containsPhi: z.boolean(),
  message: z.string().min(1),
});

const reviewDecisionSchema = z.object({
  reviewerId: z.string().min(1),
  comments: z.string().min(1),
});

export function buildApp(config: RuntimeConfig = getRuntimeConfig()) {
  const logger = createLogger(config, { app: 'api' });
  const app = Fastify({ logger });
  const auditStore = new FileAuditStore(config.persistenceDir);
  const reviewService = new ReviewQueueService(new FileReviewStore(config.persistenceDir), config);

  const persistAuditEvent = <TPayload extends Record<string, unknown>>(event: ReturnType<typeof createAuditEvent<TPayload>>) =>
    auditStore.append(event);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async () => ({
    status: 'ready',
    openAi: getOpenAiClientStatus(config),
    approvalsRequiredForWrites: config.requireHumanApprovalForWrites,
    authorizedReviewerCount: config.authorizedReviewerIds.length,
  }));

  app.get('/v1/use-cases', async () => ({
    useCases: listUseCaseDefinitions(),
  }));

  app.get('/v1/tooling/mock-capabilities', async () => ({
    documents: {
      mode: 'mock',
      provider: 'mock-documents',
      supports: ['ingest', 'extract', 'summarize', 'classify', 'generate-letter'],
    },
    fhir: {
      mode: 'mock',
      provider: 'mock-fhir',
      supports: ['search', 'read'],
    },
  }));

  app.get('/v1/evals/summary', async () => ({
    summary: runEvaluations(config),
  }));

  app.get('/v1/audit/events', async () => ({
    events: auditStore.list(),
  }));

  app.get('/v1/reviews', async () => ({
    reviews: reviewService.list(),
  }));

  app.get('/v1/reviews/:reviewId', async (request, reply) => {
    const params = z.object({ reviewId: z.string().uuid() }).parse(request.params);
    const review = reviewService.get(params.reviewId);
    if (!review) {
      reply.code(404);
      return { error: 'review_not_found' };
    }
    return { review };
  });

  app.post('/v1/orchestrate', async (request, reply) => {
    const body = orchestrateBodySchema.parse(request.body);
    const result = routeAgentTask(body, config);
    const auditEvent = persistAuditEvent(createAuditEvent({
      eventType: 'orchestration.requested',
      actorId: body.userId,
      requestId: body.requestId,
      payload: {
        useCase: body.useCase,
        actionType: body.actionType,
        containsPhi: body.containsPhi,
        decisionStatus: result.decision.status,
        workflowStage: result.plan.stage,
        executionStatus: result.execution.status,
      },
    }));

    const reviewRequest =
      result.decision.status === 'held_for_human_review'
        ? reviewService.enqueue(body, result)
        : null;

    if (reviewRequest) {
      persistAuditEvent(createAuditEvent({
        eventType: 'review.requested',
        actorId: body.userId,
        requestId: body.requestId,
        payload: {
          reviewId: reviewRequest.reviewId,
          workflowId: reviewRequest.workflowId,
          reason: reviewRequest.reason,
        },
      }));
    }

    reply.code(result.decision.status === 'rejected' ? 403 : 200);
    return {
      request: body,
      result,
      auditEvent,
      reviewRequest,
    };
  });

  app.post('/v1/reviews/:reviewId/approve', async (request, reply) => {
    const params = z.object({ reviewId: z.string().uuid() }).parse(request.params);
    const body = reviewDecisionSchema.parse(request.body);

    try {
      const approval = reviewService.approve(params.reviewId, body.reviewerId, body.comments);
      const auditEvent = persistAuditEvent(createAuditEvent({
        eventType: 'review.approved',
        actorId: body.reviewerId,
        requestId: approval.review.requestId,
        payload: {
          reviewId: approval.review.reviewId,
          comments: body.comments,
          executionStatus: approval.result.execution.status,
        },
      }));

      return {
        review: approval.review,
        result: approval.result,
        auditEvent,
      };
    } catch (error) {
      reply.code(error instanceof ReviewerAuthorizationError ? 403 : 400);
      return { error: error instanceof Error ? error.message : 'review_approval_failed' };
    }
  });

  app.post('/v1/reviews/:reviewId/reject', async (request, reply) => {
    const params = z.object({ reviewId: z.string().uuid() }).parse(request.params);
    const body = reviewDecisionSchema.parse(request.body);

    try {
      const rejection = reviewService.reject(params.reviewId, body.reviewerId, body.comments);
      const auditEvent = persistAuditEvent(createAuditEvent({
        eventType: 'review.rejected',
        actorId: body.reviewerId,
        requestId: rejection.review.requestId,
        payload: {
          reviewId: rejection.review.reviewId,
          comments: body.comments,
        },
      }));

      return {
        review: rejection.review,
        auditEvent,
      };
    } catch (error) {
      reply.code(error instanceof ReviewerAuthorizationError ? 403 : 400);
      return { error: error instanceof Error ? error.message : 'review_rejection_failed' };
    }
  });

  return app;
}
