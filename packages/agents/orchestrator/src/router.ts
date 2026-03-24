import type { RuntimeConfig } from '../../../config/src/index.js';
import type { AgentTask } from '../../shared/src/index.js';
import { evaluateTaskPolicy } from '../../../safety/src/index.js';
import { buildWorkflowResult, runWorkflow } from '../../../orchestration/src/index.js';
import { getUseCaseDefinition } from '../../../use-cases/src/index.js';

export function routeAgentTask(task: AgentTask, config: RuntimeConfig) {
  const definition = getUseCaseDefinition(task.useCase);
  if (definition.actionType !== task.actionType && task.useCase !== 'unknown') {
    return buildWorkflowResult(
      {
        ...task,
        useCase: 'unknown',
      },
      {
        allowed: true,
        reason: `Requested action type ${task.actionType} does not match the supported mode for ${task.useCase}.`,
        requiresHumanApproval: false,
      }
    );
  }

  const policy = evaluateTaskPolicy(task, config);
  return runWorkflow(task, policy, config);
}
