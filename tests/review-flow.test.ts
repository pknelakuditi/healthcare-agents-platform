import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../apps/api/src/app.js';
import type { RuntimeConfig } from '../packages/config/src/index.js';

let persistenceDir: string;
const appsToClose: ReturnType<typeof buildApp>[] = [];

function createConfig(): RuntimeConfig {
  return {
    nodeEnv: 'test',
    logLevel: 'info',
    apiPort: 3000,
    workerPollIntervalMs: 5000,
    defaultOpenAiModel: 'gpt-5.4',
    openAiApiKey: undefined,
    allowPhiWithOpenAi: false,
    requireHumanApprovalForWrites: true,
    enableMockOpenAi: true,
    persistenceDir,
    authorizedReviewerIds: ['reviewer-1', 'supervisor-1'],
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
}

beforeEach(() => {
  persistenceDir = mkdtempSync(path.join(os.tmpdir(), 'healthcare-agents-review-'));
});

afterEach(async () => {
  await Promise.all(appsToClose.splice(0).map((app) => app.close()));
  rmSync(persistenceDir, { recursive: true, force: true });
});

describe('review flow', () => {
  it('creates and lists review requests for write workflows', async () => {
    const app = buildApp(createConfig());
    appsToClose.push(app);

    const orchestrationResponse = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'write-1',
        userId: 'ops-user',
        useCase: 'patient-outreach',
        actionType: 'write',
        containsPhi: false,
        message: 'Send a reminder to the patient.',
      },
    });

    const orchestrationBody = orchestrationResponse.json();
    expect(orchestrationBody.reviewRequest.status).toBe('pending');

    const listResponse = await app.inject({
      method: 'GET',
      url: '/v1/reviews',
    });

    const listBody = listResponse.json();
    expect(listBody.reviews).toHaveLength(1);
    expect(listBody.reviews[0].requestId).toBe('write-1');
  });

  it('approves a review request and executes the write workflow in mock mode', async () => {
    const app = buildApp(createConfig());
    appsToClose.push(app);

    const orchestrationResponse = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'write-2',
        userId: 'ops-user',
        useCase: 'patient-outreach',
        actionType: 'write',
        containsPhi: false,
        message: 'Send a reminder to the patient.',
      },
    });

    const reviewId = orchestrationResponse.json().reviewRequest.reviewId;

    const approveResponse = await app.inject({
      method: 'POST',
      url: `/v1/reviews/${reviewId}/approve`,
      payload: {
        reviewerId: 'reviewer-1',
        comments: 'Approved for mock outreach execution.',
      },
    });

    const body = approveResponse.json();
    expect(approveResponse.statusCode).toBe(200);
    expect(body.review.status).toBe('approved');
    expect(body.result.execution.status).toBe('completed');
    expect(body.result.execution.artifacts.some((artifact: { id: string }) => artifact.id.includes('outreach'))).toBe(true);
  });

  it('rejects review decisions from unauthorized reviewer ids', async () => {
    const app = buildApp(createConfig());
    appsToClose.push(app);

    const orchestrationResponse = await app.inject({
      method: 'POST',
      url: '/v1/orchestrate',
      payload: {
        requestId: 'write-3',
        userId: 'ops-user',
        useCase: 'patient-outreach',
        actionType: 'write',
        containsPhi: false,
        message: 'Send a reminder to the patient.',
      },
    });

    const reviewId = orchestrationResponse.json().reviewRequest.reviewId;

    const rejectResponse = await app.inject({
      method: 'POST',
      url: `/v1/reviews/${reviewId}/reject`,
      payload: {
        reviewerId: 'unauthorized-user',
        comments: 'Attempting rejection.',
      },
    });

    expect(rejectResponse.statusCode).toBe(403);
  });
});
