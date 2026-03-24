import type { AgentDecision, AgentTask } from '../../agents/shared/src/index.js';
import type { PolicyDecision } from '../../safety/src/index.js';

export interface WorkflowResult {
  decision: AgentDecision;
  policy: PolicyDecision;
}

export function buildWorkflowResult(task: AgentTask, policy: PolicyDecision): WorkflowResult {
  if (!policy.allowed) {
    return {
      policy,
      decision: {
        workflow: 'blocked',
        assignedAgent: 'qa-agent',
        status: 'rejected',
        rationale: policy.reason,
        nextStep: 'Return policy failure and stop automation.',
      },
    };
  }

  if (policy.requiresHumanApproval) {
    return {
      policy,
      decision: {
        workflow: `${task.useCase}-approval`,
        assignedAgent: 'human-review-gateway',
        status: 'held_for_human_review',
        rationale: policy.reason,
        nextStep: 'Queue the request for manual review before any write-side effect.',
      },
    };
  }

  return {
    policy,
    decision: {
      workflow: `${task.useCase}-workflow`,
      assignedAgent: 'orchestrator-agent',
      status: 'accepted',
      rationale: policy.reason,
      nextStep: 'Continue to use-case specific tool selection and execution.',
    },
  };
}
