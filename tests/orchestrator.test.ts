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
  persistenceDir: '.runtime/test-orchestrator',
  authorizedReviewerIds: ['reviewer-1'],
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
    expect(result.decision.assignedAgent).toBe('docs-agent');
    expect(result.plan.stage).toBe('completed');
    expect(result.plan.toolPlans[0]?.toolset).toBe('documents');
    expect(result.execution.status).toBe('completed');
    expect(result.execution.artifacts.some((artifact) => artifact.kind === 'summary')).toBe(true);
    expect(result.execution.artifacts.some((artifact) => artifact.kind === 'evidence-package')).toBe(true);
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
    expect(result.plan.stage).toBe('human_review');
    expect(result.execution.status).toBe('not_started');
  });

  it('falls back to unknown routing when action type mismatches the use case', () => {
    const result = routeAgentTask(
      {
        requestId: 'bad-mode',
        userId: 'user-1',
        useCase: 'document-summary',
        actionType: 'write',
        containsPhi: false,
        message: 'Write a payer response letter.',
      },
      config
    );

    expect(result.decision.workflow).toBe('manual-triage');
    expect(result.plan.owningAgent).toBe('qa-agent');
    expect(result.execution.status).toBe('not_started');
  });

  it('executes intake workflows and returns intake classification artifacts', () => {
    const result = routeAgentTask(
      {
        requestId: 'intake-read',
        userId: 'user-1',
        useCase: 'intake',
        actionType: 'read',
        containsPhi: false,
        message: 'Process the new patient intake packet.',
      },
      config
    );

    expect(result.execution.status).toBe('completed');
    expect(result.execution.artifacts.some((artifact) => artifact.kind === 'classification')).toBe(true);
  });
});
