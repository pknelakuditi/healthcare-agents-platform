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
  };
}

export function loadRuntimeConfig(source: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  if (source === process.env) {
    dotenv.config();
  }

  const parsed = runtimeConfigSchema.parse(normalizeEnv(source));
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
