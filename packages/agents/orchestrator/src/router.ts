import type { RuntimeConfig } from '../../../config/src/index.js';
import type { AgentTask } from '../../shared/src/index.js';
import { evaluateTaskPolicy } from '../../../safety/src/index.js';
import { buildWorkflowResult } from '../../../orchestration/src/index.js';

export function routeAgentTask(task: AgentTask, config: RuntimeConfig) {
  const policy = evaluateTaskPolicy(task, config);
  return buildWorkflowResult(task, policy);
}
