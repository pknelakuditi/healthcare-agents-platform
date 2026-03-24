import { describe, expect, it } from 'vitest';
import { routeAgentTask } from '../packages/agents/orchestrator/src/index.js';
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

describe('routeAgentTask', () => {
  it('accepts safe read-only tasks', () => {
    const result = routeAgentTask(
      {
        requestId: 'safe-read',
        userId: 'user-1',
        useCase: 'document-summary',
        actionType: 'read',
        containsPhi: false,
        message: 'Summarize a de-identified chart.',
      },
      config
    );

    expect(result.decision.status).toBe('accepted');
    expect(result.decision.assignedAgent).toBe('orchestrator-agent');
  });

  it('routes writes into human review', () => {
    const result = routeAgentTask(
      {
        requestId: 'write-review',
        userId: 'user-1',
        useCase: 'patient-outreach',
        actionType: 'write',
        containsPhi: false,
        message: 'Send reminder.',
      },
      config
    );

    expect(result.decision.status).toBe('held_for_human_review');
    expect(result.decision.assignedAgent).toBe('human-review-gateway');
  });
});
