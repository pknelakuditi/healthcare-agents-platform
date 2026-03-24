import OpenAI from 'openai';
import type { RuntimeConfig } from '../../../config/src/index.js';

export interface OpenAiClientStatus {
  enabled: boolean;
  mode: 'mock' | 'live';
  model: string;
}

export function getOpenAiClientStatus(config: RuntimeConfig): OpenAiClientStatus {
  if (config.enableMockOpenAi || !config.openAiApiKey) {
    return {
      enabled: true,
      mode: 'mock',
      model: config.defaultOpenAiModel,
    };
  }

  return {
    enabled: true,
    mode: 'live',
    model: config.defaultOpenAiModel,
  };
}

export function createOpenAiClient(config: RuntimeConfig): OpenAI | null {
  if (config.enableMockOpenAi || !config.openAiApiKey) {
    return null;
  }

  return new OpenAI({ apiKey: config.openAiApiKey });
}
