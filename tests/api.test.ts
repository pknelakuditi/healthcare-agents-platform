import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from '../apps/api/src/app.js';
import type { RuntimeConfig } from '../packages/config/src/index.js';

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
  persistenceDir: '.runtime/test-api',
  authorizedReviewerIds: ['supervisor-1', 'reviewer-1'],
  requireApiAuthentication: false,
  apiClients: [],
  allowMockOpenAiInProduction: false,
  trustProxy: false,
  securityHeadersEnabled: true,
  hstsMaxAgeSeconds: 15552000,
};

const appsToClose: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(appsToClose.splice(0).map((app) => app.close()));
});

describe('api', () => {
  it('returns health status', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'api' });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('requires API client authentication on protected routes when enabled', async () => {
    const app = buildApp({
      ...config,
      requireApiAuthentication: true,
      apiClients: [{ clientId: 'ops-client', apiKey: 'super-secret-auth-key' }],
    });
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ error: 'api_authentication_required' });
  });

  it('accepts authenticated API clients on protected routes', async () => {
    const app = buildApp({
      ...config,
      requireApiAuthentication: true,
      apiClients: [{ clientId: 'ops-client', apiKey: 'super-secret-auth-key' }],
    });
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/ready',
      headers: {
        'x-client-id': 'ops-client',
        'x-api-key': 'super-secret-auth-key',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ready',
      apiAuthenticationRequired: true,
      configuredApiClientCount: 1,
      securityHeadersEnabled: true,
    });
  });

  it('returns orchestration output for safe reads', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'req-1',
        userId: 'user-1',
        useCase: 'document-summary',
        actionType: 'read',
        containsPhi: false,
        message: 'Summarize the intake packet.',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.result.decision.status).toBe('accepted');
    expect(body.result.plan.stage).toBe('completed');
    expect(body.result.execution.status).toBe('completed');
    expect(body.auditEvent.eventType).toBe('orchestration.requested');
  });

  it('rejects PHI requests while PHI processing is disabled', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'req-2',
        userId: 'user-1',
        useCase: 'document-summary',
        actionType: 'read',
        containsPhi: true,
        message: 'Summarize the chart.',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(403);
    expect(body.result.decision.status).toBe('rejected');
    expect(body.result.plan.stage).toBe('blocked');
    expect(body.result.execution.status).toBe('not_started');
  });

  it('lists supported use cases', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/use-cases',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(body.useCases)).toBe(true);
    expect(body.useCases.some((item: { useCase: string }) => item.useCase === 'document-summary')).toBe(true);
  });

  it('reports mock tool capabilities', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/tooling/mock-capabilities',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.documents.mode).toBe('mock');
    expect(body.documents.provider).toBe('mock-documents');
    expect(body.fhir.supports).toContain('read');
  });

  it('returns evaluation summary', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/v1/evals/summary',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.summary.total).toBeGreaterThan(0);
    expect(body.summary.failed).toBe(0);
  });

  it('persists audit events and review requests for gated write flows', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const orchestrationResponse = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'req-review-1',
        userId: 'user-1',
        useCase: 'patient-outreach',
        actionType: 'write',
        containsPhi: false,
        message: 'Send a reminder message.',
      },
    });

    const orchestrationBody = orchestrationResponse.json();
    expect(orchestrationBody.reviewRequest.status).toBe('pending');

    const reviewsResponse = await app.inject({
      method: 'GET',
      url: '/v1/reviews',
    });

    const auditResponse = await app.inject({
      method: 'GET',
      url: '/v1/audit/events',
    });

    expect(reviewsResponse.json().reviews.length).toBeGreaterThan(0);
    expect(auditResponse.json().events.length).toBeGreaterThan(0);
  });

  it('rejects unauthorized reviewers on approval endpoints', async () => {
    const app = buildApp(config);
    appsToClose.push(app);

    const orchestrationResponse = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'req-review-authz',
        userId: 'user-1',
        useCase: 'patient-outreach',
        actionType: 'write',
        containsPhi: false,
        message: 'Send a reminder message.',
      },
    });

    const reviewId = orchestrationResponse.json().reviewRequest.reviewId;
    const approvalResponse = await app.inject({
      method: 'POST',
      url: `/v1/reviews/${reviewId}/approve`,
      payload: {
        reviewerId: 'unauthorized-user',
        comments: 'Attempting approval.',
      },
    });

    expect(approvalResponse.statusCode).toBe(403);
  });
});
