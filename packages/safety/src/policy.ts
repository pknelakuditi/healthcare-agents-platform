import type { RuntimeConfig } from '../../config/src/index.js';
import type { AgentTask } from '../../agents/shared/src/index.js';

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
  requiresHumanApproval: boolean;
}

export function evaluateTaskPolicy(task: AgentTask, config: RuntimeConfig): PolicyDecision {
  if (task.containsPhi && !config.allowPhiWithOpenAi) {
    return {
      allowed: false,
      reason: 'PHI processing with OpenAI is disabled in the current environment.',
      requiresHumanApproval: false,
    };
  }

  if (task.actionType === 'write' && config.requireHumanApprovalForWrites) {
    return {
      allowed: true,
      reason: 'Write action requires human approval before execution.',
      requiresHumanApproval: true,
    };
  }

  return {
    allowed: true,
    reason: 'Task satisfies current platform policy.',
    requiresHumanApproval: false,
  };
}
