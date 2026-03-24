import pino, { type Logger, type LoggerOptions } from 'pino';
import type { RuntimeConfig } from '../../config/src/index.js';

export function createLogger(config: RuntimeConfig, bindings: LoggerOptions['base'] = {}): Logger {
  return pino({
    level: config.logLevel,
    base: {
      service: 'healthcare-agents-platform',
      ...bindings,
    },
  });
}
