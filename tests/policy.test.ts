import { describe, expect, it } from 'vitest';
import { evaluateTaskPolicy } from '../packages/safety/src/index.js';
import type { AgentTask } from '../packages/agents/shared/src/index.js';
import type { RuntimeConfig } from '../packages/config/src/index.js';

const baseConfig: RuntimeConfig = {
  nodeEnv: 'test',
  logLevel: 'info',
  apiPort: 3000,
  workerPollIntervalMs: 5000,
  defaultOpenAiModel: 'gpt-5.4',
  openAiApiKey: undefined,
  allowPhiWithOpenAi: false,
  requireHumanApprovalForWrites: true,
  enableMockOpenAi: true,
  persistenceDir: '.runtime/test-policy',
  authorizedReviewerIds: ['reviewer-1'],
  requireApiAuthentication: false,
  apiClients: [],
  allowMockOpenAiInProduction: false,
  trustProxy: false,
  securityHeadersEnabled: true,
  hstsMaxAgeSeconds: 15552000,
};

const readTask: AgentTask = {
  requestId: 'req-1',
  userId: 'user-1',
  useCase: 'document-summary',
  actionType: 'read',
  containsPhi: false,
  message: 'Summarize the chart.',
};

describe('evaluateTaskPolicy', () => {
  it('blocks PHI requests when PHI processing is disabled', () => {
    const decision = evaluateTaskPolicy(
      {
        ...readTask,
        containsPhi: true,
      },
      baseConfig
    );

    expect(decision.allowed).toBe(false);
    expect(decision.requiresHumanApproval).toBe(false);
  });

  it('holds write actions for human review', () => {
    const decision = evaluateTaskPolicy(
      {
        ...readTask,
        actionType: 'write',
      },
      baseConfig
    );

    expect(decision.allowed).toBe(true);
    expect(decision.requiresHumanApproval).toBe(true);
  });
});
