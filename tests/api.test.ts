import { createHash, createHmac } from 'node:crypto';
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

const appsToClose: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(appsToClose.splice(0).map((app) => app.close()));
});

function createRequestSignature(input: {
  method: string;
  path: string;
  body?: unknown;
  secret: string;
  timestamp: string;
  nonce: string;
}): string {
  const bodyPayload = input.body === undefined ? '' : JSON.stringify(input.body);
  const bodyDigest = createHash('sha256').update(bodyPayload).digest('hex');
  const payload = [input.method.toUpperCase(), input.path, input.timestamp, input.nonce, bodyDigest].join('\n');
  return createHmac('sha256', input.secret).update(payload).digest('hex');
}

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
      apiAuthenticationMode: 'shared-key',
      configuredApiClientCount: 1,
      securityHeadersEnabled: true,
    });
  });

  it('accepts HMAC-signed requests on protected routes', async () => {
    const timestamp = String(Date.now());
    const nonce = 'nonce-1';
    const app = buildApp({
      ...config,
      requireApiAuthentication: true,
      apiAuthenticationMode: 'hmac-signature',
      apiClients: [{ clientId: 'signed-client', apiKey: 'super-secret-signing-key' }],
    });
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/ready',
      headers: {
        'x-client-id': 'signed-client',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': createRequestSignature({
          method: 'GET',
          path: '/ready',
          secret: 'super-secret-signing-key',
          timestamp,
          nonce,
        }),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ready',
      apiAuthenticationMode: 'hmac-signature',
    });
  });

  it('rejects replayed HMAC nonces on protected routes', async () => {
    const timestamp = String(Date.now());
    const nonce = 'nonce-replay-1';
    const signature = createRequestSignature({
      method: 'GET',
      path: '/ready',
      secret: 'super-secret-signing-key',
      timestamp,
      nonce,
    });
    const app = buildApp({
      ...config,
      requireApiAuthentication: true,
      apiAuthenticationMode: 'hmac-signature',
      apiClients: [{ clientId: 'signed-client', apiKey: 'super-secret-signing-key' }],
    });
    appsToClose.push(app);

    const firstResponse = await app.inject({
      method: 'GET',
      url: '/ready',
      headers: {
        'x-client-id': 'signed-client',
        'x-timestamp': timestamp,
        'x-nonce': nonce,
        'x-signature': signature,
      },
    });

    const replayedResponse = await app.inject({
      method: 'GET',
      url: '/ready',
      headers: {
        'x-client-id': 'signed-client',
        'x-timestamp': String(Date.now()),
        'x-nonce': nonce,
        'x-signature': signature,
      },
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(replayedResponse.statusCode).toBe(401);
    expect(replayedResponse.json()).toEqual({ error: 'api_authentication_failed' });
  });

  it('accepts gateway-asserted identity headers when configured', async () => {
    const app = buildApp({
      ...config,
      requireApiAuthentication: true,
      apiAuthenticationMode: 'gateway-asserted',
      trustProxy: true,
      gatewaySharedSecret: 'gateway-shared-secret',
      apiClients: [{ clientId: 'ignored-client', apiKey: 'super-secret-auth-key' }],
    });
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/ready',
      headers: {
        'x-gateway-auth': 'gateway-shared-secret',
        'x-authenticated-client-id': 'gateway-client',
        'x-authenticated-user-id': 'gateway-user',
        'x-authenticated-scopes': 'readiness:read,reviews:write',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ready',
      apiAuthenticationMode: 'gateway-asserted',
    });
  });

  it('returns 429 when the fixed-window rate limit is exceeded', async () => {
    const app = buildApp({
      ...config,
      rateLimitMaxRequests: 1,
      rateLimitWindowMs: 60000,
    });
    appsToClose.push(app);

    const firstResponse = await app.inject({
      method: 'GET',
      url: '/health',
      remoteAddress: '10.0.0.10',
    });

    const secondResponse = await app.inject({
      method: 'GET',
      url: '/health',
      remoteAddress: '10.0.0.10',
    });

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(429);
    expect(secondResponse.json()).toEqual({ error: 'rate_limit_exceeded' });
    expect(secondResponse.headers['retry-after']).toBeDefined();
  });

  it('handles allowed CORS preflight requests', async () => {
    const app = buildApp({
      ...config,
      corsEnabled: true,
      corsAllowedOrigins: ['https://ops.example.com'],
    });
    appsToClose.push(app);

    const response = await app.inject({
      method: 'OPTIONS',
      url: '/ready',
      headers: {
        origin: 'https://ops.example.com',
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://ops.example.com');
  });

  it('rejects disallowed origins when CORS is enabled', async () => {
    const app = buildApp({
      ...config,
      corsEnabled: true,
      corsAllowedOrigins: ['https://ops.example.com'],
    });
    appsToClose.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        origin: 'https://evil.example.com',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: 'origin_not_allowed' });
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
