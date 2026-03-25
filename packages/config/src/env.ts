import dotenv from 'dotenv';
import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

const stringArrayFromEnv = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value;
}, z.array(z.string().min(1)));

const apiClientsFromEnv = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf(':');
        if (separatorIndex === -1) {
          return {
            clientId: entry,
            apiKey: '',
          };
        }

        return {
          clientId: entry.slice(0, separatorIndex).trim(),
          apiKey: entry.slice(separatorIndex + 1).trim(),
        };
      });
  }

  return value;
}, z.array(z.object({
  clientId: z.string().min(1),
  apiKey: z.string().min(16),
})));

const nonNegativeIntegerFromEnv = z.preprocess((value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }

  return value;
}, z.number().int().nonnegative());

const positiveIntegerFromEnv = z.preprocess((value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return Number(value);
  }

  return value;
}, z.number().int().positive());

export type ApiClientCredential = {
  clientId: string;
  apiKey: string;
};

const runtimeConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  apiPort: z.coerce.number().int().positive().default(3000),
  workerPollIntervalMs: z.coerce.number().int().positive().default(5000),
  defaultOpenAiModel: z.string().min(1).default('gpt-5.4'),
  openAiApiKey: z.string().optional(),
  allowPhiWithOpenAi: booleanFromEnv.default(false),
  requireHumanApprovalForWrites: booleanFromEnv.default(true),
  enableMockOpenAi: booleanFromEnv.default(true),
  persistenceDir: z.string().min(1).default('.runtime'),
  authorizedReviewerIds: stringArrayFromEnv.default(['supervisor-1', 'reviewer-1']),
  requireApiAuthentication: booleanFromEnv.default(false),
  apiAuthenticationMode: z.enum(['shared-key', 'hmac-signature', 'gateway-asserted']).default('shared-key'),
  apiClients: apiClientsFromEnv.default([]),
  gatewaySharedSecret: z.string().optional(),
  allowMockOpenAiInProduction: booleanFromEnv.default(false),
  trustProxy: booleanFromEnv.default(false),
  securityHeadersEnabled: booleanFromEnv.default(true),
  hstsMaxAgeSeconds: nonNegativeIntegerFromEnv.default(15552000),
  rateLimitingEnabled: booleanFromEnv.default(true),
  rateLimitWindowMs: positiveIntegerFromEnv.default(60000),
  rateLimitMaxRequests: positiveIntegerFromEnv.default(120),
  corsEnabled: booleanFromEnv.default(false),
  corsAllowedOrigins: stringArrayFromEnv.default([]),
  maxRequestSignatureAgeSeconds: positiveIntegerFromEnv.default(300),
});

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

let cachedConfig: RuntimeConfig | null = null;

function normalizeEnv(source: NodeJS.ProcessEnv): Record<string, unknown> {
  return {
    nodeEnv: source.NODE_ENV,
    logLevel: source.LOG_LEVEL,
    apiPort: source.API_PORT,
    workerPollIntervalMs: source.WORKER_POLL_INTERVAL_MS,
    defaultOpenAiModel: source.DEFAULT_OPENAI_MODEL,
    openAiApiKey: source.OPENAI_API_KEY,
    allowPhiWithOpenAi: source.ALLOW_PHI_WITH_OPENAI,
    requireHumanApprovalForWrites: source.REQUIRE_HUMAN_APPROVAL_FOR_WRITES,
    enableMockOpenAi: source.ENABLE_MOCK_OPENAI,
    persistenceDir: source.PERSISTENCE_DIR,
    authorizedReviewerIds: source.AUTHORIZED_REVIEWER_IDS,
    requireApiAuthentication:
      source.REQUIRE_API_AUTHENTICATION ?? (source.NODE_ENV === 'production' ? 'true' : 'false'),
    apiAuthenticationMode: source.API_AUTHENTICATION_MODE,
    apiClients: source.API_CLIENT_KEYS,
    gatewaySharedSecret: source.GATEWAY_SHARED_SECRET,
    allowMockOpenAiInProduction: source.ALLOW_MOCK_OPENAI_IN_PRODUCTION,
    trustProxy: source.TRUST_PROXY,
    securityHeadersEnabled: source.SECURITY_HEADERS_ENABLED,
    hstsMaxAgeSeconds: source.HSTS_MAX_AGE_SECONDS,
    rateLimitingEnabled: source.RATE_LIMITING_ENABLED,
    rateLimitWindowMs: source.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: source.RATE_LIMIT_MAX_REQUESTS,
    corsEnabled: source.CORS_ENABLED,
    corsAllowedOrigins: source.CORS_ALLOWED_ORIGINS,
    maxRequestSignatureAgeSeconds: source.MAX_REQUEST_SIGNATURE_AGE_SECONDS,
  };
}

function validateRuntimeConfig(config: RuntimeConfig): RuntimeConfig {
  if (config.requireApiAuthentication && config.apiClients.length === 0) {
    throw new Error('API authentication is enabled, but API_CLIENT_KEYS is empty.');
  }

  if (config.apiAuthenticationMode === 'hmac-signature' && !config.requireApiAuthentication) {
    throw new Error('HMAC request signatures require API authentication to remain enabled.');
  }

  if (config.apiAuthenticationMode === 'gateway-asserted') {
    if (!config.requireApiAuthentication) {
      throw new Error('Gateway asserted authentication requires API authentication to remain enabled.');
    }

    if (!config.trustProxy) {
      throw new Error('Gateway asserted authentication requires TRUST_PROXY=true.');
    }

    if (!config.gatewaySharedSecret) {
      throw new Error('Gateway asserted authentication requires GATEWAY_SHARED_SECRET.');
    }
  }

  if (config.corsEnabled && config.corsAllowedOrigins.length === 0) {
    throw new Error('CORS is enabled, but CORS_ALLOWED_ORIGINS is empty.');
  }

  if (config.nodeEnv === 'production' && !config.requireApiAuthentication) {
    throw new Error('Production mode requires API authentication to remain enabled.');
  }

  if (config.nodeEnv === 'production' && config.enableMockOpenAi && !config.allowMockOpenAiInProduction) {
    throw new Error('Production mode cannot run with ENABLE_MOCK_OPENAI=true unless ALLOW_MOCK_OPENAI_IN_PRODUCTION=true is explicitly set.');
  }

  if (config.nodeEnv === 'production' && !config.enableMockOpenAi && !config.openAiApiKey) {
    throw new Error('Production mode requires OPENAI_API_KEY when mock OpenAI is disabled.');
  }

  return config;
}

export function loadRuntimeConfig(source: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  if (source === process.env) {
    dotenv.config();
  }

  const parsed = validateRuntimeConfig(runtimeConfigSchema.parse(normalizeEnv(source)));
  if (source === process.env) {
    cachedConfig = parsed;
  }
  return parsed;
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!cachedConfig) {
    cachedConfig = loadRuntimeConfig();
  }
  return cachedConfig;
}
