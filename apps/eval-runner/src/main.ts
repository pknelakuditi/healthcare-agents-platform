import { getRuntimeConfig } from '../../../packages/config/src/index.js';
import { createLogger } from '../../../packages/observability/src/index.js';
import { runEvaluations } from '../../../packages/evals/src/index.js';

const config = getRuntimeConfig();
const logger = createLogger(config, { app: 'eval-runner' });
const summary = runEvaluations(config);

logger.info({ summary }, 'Completed evaluation run.');
