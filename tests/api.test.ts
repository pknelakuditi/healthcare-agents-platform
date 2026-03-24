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
  });
});
