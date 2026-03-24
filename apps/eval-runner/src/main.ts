import { getRuntimeConfig } from '../../../packages/config/src/index.js';
import { createLogger } from '../../../packages/observability/src/index.js';
import { routeAgentTask } from '../../../packages/agents/orchestrator/src/index.js';

const config = getRuntimeConfig();
const logger = createLogger(config, { app: 'eval-runner' });

const sampleCases = [
  {
    requestId: 'eval-read-safe',
    userId: 'eval-user',
    useCase: 'document-summary' as const,
    actionType: 'read' as const,
    containsPhi: false,
    message: 'Summarize a de-identified discharge note.',
  },
  {
    requestId: 'eval-intake-1',
    userId: 'eval-user',
    useCase: 'intake' as const,
    actionType: 'read' as const,
    containsPhi: false,
    message: 'Normalize the intake packet and verify eligibility context.',
  },
  {
    requestId: 'eval-write-review',
    userId: 'eval-user',
    useCase: 'patient-outreach' as const,
    actionType: 'write' as const,
    containsPhi: false,
    message: 'Send a reminder message.',
  },
];

const results = sampleCases.map((task) => routeAgentTask(task, config));

logger.info({ results }, 'Completed baseline orchestration evaluation run.');
