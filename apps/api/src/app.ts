import Fastify from 'fastify';
import { z } from 'zod';
import { getRuntimeConfig, type RuntimeConfig } from '../../../packages/config/src/index.js';
import { createLogger } from '../../../packages/observability/src/index.js';
import { routeAgentTask } from '../../../packages/agents/orchestrator/src/index.js';
import { createAuditEvent, type AuditRepository } from '../../../packages/data/audit/src/index.js';
import { getOpenAiClientStatus } from '../../../packages/ai/openai/src/index.js';
import { listUseCaseDefinitions } from '../../../packages/use-cases/src/index.js';
import type { ReviewRepository } from '../../../packages/review/src/index.js';
import { ReviewQueueService } from '../../../packages/review/src/service.js';
import {
  ApiAuthenticationError,
  ApiAuthenticationRequiredError,
  authenticateApiClient,
  ReviewerAuthorizationError,
} from '../../../packages/auth/src/index.js';
import { runEvaluations } from '../../../packages/evals/src/index.js';
import { createPersistenceRepositories, PersistenceError } from '../../../packages/persistence/src/index.js';

interface AppDependencies {
  auditRepository?: AuditRepository;
  reviewRepository?: ReviewRepository;
}

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

export function buildApp(config: RuntimeConfig = getRuntimeConfig(), deps: AppDependencies = {}) {
  const logger = createLogger(config, { app: 'api' });
  const app = Fastify({
    logger,
    trustProxy: config.trustProxy,
  });
  const persistence = createPersistenceRepositories(config);
  const auditStore: AuditRepository = deps.auditRepository ?? persistence.auditRepository;
  const reviewRepository: ReviewRepository = deps.reviewRepository ?? persistence.reviewRepository;
  const reviewService = new ReviewQueueService(reviewRepository, config);
  const publicPaths = new Set(['/health']);
  const rateLimitState = new Map<string, { count: number; windowStartedAt: number }>();

  const persistAuditEvent = <TPayload extends Record<string, unknown>>(event: ReturnType<typeof createAuditEvent<TPayload>>) =>
    auditStore.append(event);

  app.addHook('onRequest', async (request, reply) => {
    const requestPath = request.raw.url?.split('?')[0] ?? request.url;
    const origin = request.headers.origin;

    if (config.corsEnabled && origin) {
      if (!config.corsAllowedOrigins.includes(origin)) {
        reply.code(403);
        return reply.send({ error: 'origin_not_allowed' });
      }

      reply.header('access-control-allow-origin', origin);
      reply.header('vary', 'Origin');
      reply.header('access-control-allow-methods', 'GET,POST,OPTIONS');
      reply.header(
        'access-control-allow-headers',
        'content-type,x-client-id,x-api-key,x-timestamp,x-signature,authorization',
      );
    }

    if (request.method === 'OPTIONS') {
      reply.code(204);
      return reply.send();
    }

    if (config.rateLimitingEnabled) {
      const clientIdHeader = Array.isArray(request.headers['x-client-id'])
        ? request.headers['x-client-id'][0]
        : request.headers['x-client-id'];
      const rateLimitKey = clientIdHeader ?? request.ip;
      const now = Date.now();
      const existingWindow = rateLimitState.get(rateLimitKey);

      if (!existingWindow || now - existingWindow.windowStartedAt >= config.rateLimitWindowMs) {
        rateLimitState.set(rateLimitKey, { count: 1, windowStartedAt: now });
      } else if (existingWindow.count >= config.rateLimitMaxRequests) {
        const retryAfterSeconds = Math.ceil(
          (config.rateLimitWindowMs - (now - existingWindow.windowStartedAt)) / 1000,
        );
        reply.header('retry-after', String(retryAfterSeconds));
        reply.code(429);
        return reply.send({ error: 'rate_limit_exceeded' });
      } else {
        existingWindow.count += 1;
      }
    }

    if (publicPaths.has(requestPath)) {
      return;
    }
  });

  app.addHook('preHandler', async (request, reply) => {
    const requestPath = request.raw.url?.split('?')[0] ?? request.url;
    if (publicPaths.has(requestPath) || request.method === 'OPTIONS') {
      return;
    }

    try {
      const authenticatedClient = authenticateApiClient(request.headers, config, {
        method: request.method,
        path: requestPath,
        body: request.body,
      });
      if (authenticatedClient) {
        request.log.info(
          {
            authenticatedClientId: authenticatedClient.clientId,
            authenticationMode: authenticatedClient.authenticationMode,
          },
          'API client authenticated',
        );
      }
    } catch (error) {
      reply.code(401);
      return reply.send({
        error:
          error instanceof ApiAuthenticationRequiredError
            ? 'api_authentication_required'
            : error instanceof ApiAuthenticationError
              ? 'api_authentication_failed'
              : 'api_authentication_failed',
      });
    }
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('x-request-id', request.id);

    if (!config.securityHeadersEnabled) {
      return payload;
    }

    reply.header('x-content-type-options', 'nosniff');
    reply.header('x-frame-options', 'DENY');
    reply.header('referrer-policy', 'no-referrer');
    reply.header('cache-control', 'no-store');
    reply.header('content-security-policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

    if (config.nodeEnv === 'production' && config.hstsMaxAgeSeconds > 0) {
      reply.header(
        'strict-transport-security',
        `max-age=${config.hstsMaxAgeSeconds}; includeSubDomains`,
      );
    }

    return payload;
  });

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
    persistenceProvider: persistence.provider,
    apiAuthenticationRequired: config.requireApiAuthentication,
    apiAuthenticationMode: config.apiAuthenticationMode,
    configuredApiClientCount: config.apiClients.length,
    trustProxy: config.trustProxy,
    securityHeadersEnabled: config.securityHeadersEnabled,
    rateLimitingEnabled: config.rateLimitingEnabled,
    rateLimitWindowMs: config.rateLimitWindowMs,
    rateLimitMaxRequests: config.rateLimitMaxRequests,
    corsEnabled: config.corsEnabled,
    corsAllowedOrigins: config.corsAllowedOrigins,
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

  app.get('/v1/audit/events', async (_request, reply) => {
    try {
      return { events: auditStore.list() };
    } catch (error) {
      reply.code(error instanceof PersistenceError ? 503 : 500);
      return { error: error instanceof Error ? error.message : 'audit_read_failed' };
    }
  });

  app.get('/v1/reviews', async (_request, reply) => {
    try {
      return { reviews: reviewService.list() };
    } catch (error) {
      reply.code(error instanceof PersistenceError ? 503 : 500);
      return { error: error instanceof Error ? error.message : 'review_list_failed' };
    }
  });

  app.get('/v1/reviews/:reviewId', async (request, reply) => {
    const params = z.object({ reviewId: z.string().uuid() }).parse(request.params);
    try {
      const review = reviewService.get(params.reviewId);
      if (!review) {
        reply.code(404);
        return { error: 'review_not_found' };
      }
      return { review };
    } catch (error) {
      reply.code(error instanceof PersistenceError ? 503 : 500);
      return { error: error instanceof Error ? error.message : 'review_get_failed' };
    }
  });

  app.post('/v1/orchestrate', async (request, reply) => {
    try {
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
    } catch (error) {
      reply.code(error instanceof PersistenceError ? 503 : 500);
      return { error: error instanceof Error ? error.message : 'orchestration_failed' };
    }
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
      reply.code(
        error instanceof ReviewerAuthorizationError
          ? 403
          : error instanceof PersistenceError
            ? 503
            : 400
      );
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
      reply.code(
        error instanceof ReviewerAuthorizationError
          ? 403
          : error instanceof PersistenceError
            ? 503
            : 400
      );
      return { error: error instanceof Error ? error.message : 'review_rejection_failed' };
    }
  });

  return app;
}
