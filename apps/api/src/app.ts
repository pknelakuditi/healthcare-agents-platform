import Fastify from 'fastify';
import { z } from 'zod';
import { getRuntimeConfig, type RuntimeConfig } from '../../../packages/config/src/index.js';
import { createLogger } from '../../../packages/observability/src/index.js';
import { routeAgentTask } from '../../../packages/agents/orchestrator/src/index.js';
import { createAuditEvent } from '../../../packages/data/audit/src/index.js';
import { getOpenAiClientStatus } from '../../../packages/ai/openai/src/index.js';

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

export function buildApp(config: RuntimeConfig = getRuntimeConfig()) {
  const logger = createLogger(config, { app: 'api' });
  const app = Fastify({ logger });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async () => ({
    status: 'ready',
    openAi: getOpenAiClientStatus(config),
    approvalsRequiredForWrites: config.requireHumanApprovalForWrites,
  }));

  app.post('/v1/orchestrate', async (request, reply) => {
    const body = orchestrateBodySchema.parse(request.body);
    const result = routeAgentTask(body, config);
    const auditEvent = createAuditEvent({
      eventType: 'orchestration.requested',
      actorId: body.userId,
      requestId: body.requestId,
      payload: {
        useCase: body.useCase,
        actionType: body.actionType,
        containsPhi: body.containsPhi,
        decisionStatus: result.decision.status,
      },
    });

    reply.code(result.decision.status === 'rejected' ? 403 : 200);
    return {
      request: body,
      result,
      auditEvent,
    };
  });

  return app;
}
