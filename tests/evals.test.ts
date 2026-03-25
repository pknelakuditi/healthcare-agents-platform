import { describe, expect, it } from 'vitest';
import { runEvaluations } from '../packages/evals/src/index.js';
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
  persistenceDir: '.runtime/test-evals',
  authorizedReviewerIds: ['reviewer-1'],
  requireApiAuthentication: false,
  apiClients: [],
  allowMockOpenAiInProduction: false,
  trustProxy: false,
  securityHeadersEnabled: true,
  hstsMaxAgeSeconds: 15552000,
};

describe('runEvaluations', () => {
  it('passes all current golden cases', () => {
    const summary = runEvaluations(config);

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.failed).toBe(0);
    expect(summary.passed).toBe(summary.total);
  });
});
