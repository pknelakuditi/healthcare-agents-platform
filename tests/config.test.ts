import { describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../packages/config/src/index.js';

describe('loadRuntimeConfig', () => {
  it('applies defaults for optional values', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'test',
    });

    expect(config.apiPort).toBe(3000);
    expect(config.defaultOpenAiModel).toBe('gpt-5.4');
    expect(config.requireHumanApprovalForWrites).toBe(true);
    expect(config.authorizedReviewerIds).toEqual(['supervisor-1', 'reviewer-1']);
  });

  it('parses booleans and numbers from env strings', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'production',
      API_PORT: '4100',
      REQUIRE_HUMAN_APPROVAL_FOR_WRITES: 'false',
      ENABLE_MOCK_OPENAI: 'false',
      ALLOW_PHI_WITH_OPENAI: 'true',
      AUTHORIZED_REVIEWER_IDS: 'alice,bob',
    });

    expect(config.apiPort).toBe(4100);
    expect(config.requireHumanApprovalForWrites).toBe(false);
    expect(config.enableMockOpenAi).toBe(false);
    expect(config.allowPhiWithOpenAi).toBe(true);
    expect(config.authorizedReviewerIds).toEqual(['alice', 'bob']);
  });
});
