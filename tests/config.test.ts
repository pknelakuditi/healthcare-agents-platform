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
    expect(config.requireApiAuthentication).toBe(false);
    expect(config.apiClients).toEqual([]);
    expect(config.securityHeadersEnabled).toBe(true);
    expect(config.apiAuthenticationMode).toBe('shared-key');
    expect(config.rateLimitingEnabled).toBe(true);
    expect(config.corsEnabled).toBe(false);
  });

  it('parses booleans and numbers from env strings', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'production',
      API_PORT: '4100',
      REQUIRE_HUMAN_APPROVAL_FOR_WRITES: 'false',
      ENABLE_MOCK_OPENAI: 'false',
      OPENAI_API_KEY: 'openai-production-key',
      ALLOW_PHI_WITH_OPENAI: 'true',
      AUTHORIZED_REVIEWER_IDS: 'alice,bob',
      API_AUTHENTICATION_MODE: 'hmac-signature',
      API_CLIENT_KEYS: 'ops-client:super-secret-auth-key',
      TRUST_PROXY: 'true',
      HSTS_MAX_AGE_SECONDS: '86400',
      RATE_LIMIT_WINDOW_MS: '30000',
      RATE_LIMIT_MAX_REQUESTS: '50',
      CORS_ENABLED: 'true',
      CORS_ALLOWED_ORIGINS: 'https://ops.example.com,https://admin.example.com',
      MAX_REQUEST_SIGNATURE_AGE_SECONDS: '120',
    });

    expect(config.apiPort).toBe(4100);
    expect(config.requireHumanApprovalForWrites).toBe(false);
    expect(config.enableMockOpenAi).toBe(false);
    expect(config.allowPhiWithOpenAi).toBe(true);
    expect(config.authorizedReviewerIds).toEqual(['alice', 'bob']);
    expect(config.requireApiAuthentication).toBe(true);
    expect(config.apiAuthenticationMode).toBe('hmac-signature');
    expect(config.apiClients).toEqual([
      { clientId: 'ops-client', apiKey: 'super-secret-auth-key' },
    ]);
    expect(config.trustProxy).toBe(true);
    expect(config.hstsMaxAgeSeconds).toBe(86400);
    expect(config.rateLimitWindowMs).toBe(30000);
    expect(config.rateLimitMaxRequests).toBe(50);
    expect(config.corsEnabled).toBe(true);
    expect(config.corsAllowedOrigins).toEqual([
      'https://ops.example.com',
      'https://admin.example.com',
    ]);
    expect(config.maxRequestSignatureAgeSeconds).toBe(120);
  });

  it('rejects production mode when API authentication would be disabled', () => {
    expect(() =>
      loadRuntimeConfig({
        NODE_ENV: 'production',
        REQUIRE_API_AUTHENTICATION: 'false',
        ENABLE_MOCK_OPENAI: 'false',
        OPENAI_API_KEY: 'openai-production-key',
      }),
    ).toThrow('Production mode requires API authentication');
  });

  it('rejects production mode when mock OpenAI is left enabled', () => {
    expect(() =>
      loadRuntimeConfig({
        NODE_ENV: 'production',
        API_CLIENT_KEYS: 'ops-client:super-secret-auth-key',
        ENABLE_MOCK_OPENAI: 'true',
      }),
    ).toThrow('Production mode cannot run with ENABLE_MOCK_OPENAI=true');
  });

  it('rejects enabled CORS without allowed origins', () => {
    expect(() =>
      loadRuntimeConfig({
        NODE_ENV: 'test',
        CORS_ENABLED: 'true',
      }),
    ).toThrow('CORS is enabled, but CORS_ALLOWED_ORIGINS is empty.');
  });

  it('rejects gateway asserted mode without trust proxy and shared secret', () => {
    expect(() =>
      loadRuntimeConfig({
        NODE_ENV: 'test',
        REQUIRE_API_AUTHENTICATION: 'true',
        API_AUTHENTICATION_MODE: 'gateway-asserted',
        API_CLIENT_KEYS: 'ops-client:super-secret-auth-key',
      }),
    ).toThrow('Gateway asserted authentication requires TRUST_PROXY=true.');
  });

  it('accepts gateway asserted mode with the required settings', () => {
    const config = loadRuntimeConfig({
      NODE_ENV: 'test',
      REQUIRE_API_AUTHENTICATION: 'true',
      API_AUTHENTICATION_MODE: 'gateway-asserted',
      TRUST_PROXY: 'true',
      GATEWAY_SHARED_SECRET: 'gateway-shared-secret',
      API_CLIENT_KEYS: 'ops-client:super-secret-auth-key',
    });

    expect(config.apiAuthenticationMode).toBe('gateway-asserted');
    expect(config.gatewaySharedSecret).toBe('gateway-shared-secret');
    expect(config.trustProxy).toBe(true);
  });
});
