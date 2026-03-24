import { getRuntimeConfig } from '../../../packages/config/src/index.js';
import { createLogger } from '../../../packages/observability/src/index.js';

const config = getRuntimeConfig();
const logger = createLogger(config, { app: 'worker' });

logger.info(
  {
    pollIntervalMs: config.workerPollIntervalMs,
    humanApprovalForWrites: config.requireHumanApprovalForWrites,
  },
  'Worker bootstrapped and ready for queue integration.'
);
