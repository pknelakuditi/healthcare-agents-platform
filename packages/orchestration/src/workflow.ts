import type { AgentDecision, AgentTask, ToolPlan, WorkflowPlan } from '../../agents/shared/src/index.js';
import type { PolicyDecision } from '../../safety/src/index.js';
import { getUseCaseDefinition } from '../../use-cases/src/index.js';

export interface WorkflowResult {
  decision: AgentDecision;
  policy: PolicyDecision;
  plan: WorkflowPlan;
}

function buildToolPlans(task: AgentTask): ToolPlan[] {
  const definition = getUseCaseDefinition(task.useCase);
  const toolPlans: ToolPlan[] = [];

  if (definition.documentOperations.length > 0) {
    toolPlans.push({
      toolset: 'documents',
      operations: definition.documentOperations,
      notes: 'Document toolchain will handle ingestion, extraction, summarization, or generation.',
    });
  }

  if (definition.fhirResources.length > 0) {
    toolPlans.push({
      toolset: 'fhir',
      operations: definition.fhirResources,
      notes: `FHIR access will remain ${task.actionType} scoped for this use case.`,
    });
  }

  return toolPlans;
}

export function buildWorkflowResult(task: AgentTask, policy: PolicyDecision): WorkflowResult {
  const definition = getUseCaseDefinition(task.useCase);
  const basePlan: WorkflowPlan = {
    workflowId: `${definition.workflow}:${task.requestId}`,
    stage: 'policy_check',
    useCaseSummary: definition.summary,
    owningAgent: definition.owningAgent,
    requiredCapabilities: definition.requiredCapabilities,
    toolPlans: buildToolPlans(task),
    blockers: [],
  };

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
      plan: {
        ...basePlan,
        stage: 'blocked',
        blockers: [policy.reason],
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
      plan: {
        ...basePlan,
        stage: 'human_review',
        blockers: ['Human approval is required before write-side effects can run.'],
      },
    };
  }

  return {
    policy,
    decision: {
      workflow: definition.workflow,
      assignedAgent: definition.owningAgent,
      status: 'accepted',
      rationale: policy.reason,
      nextStep: 'Continue to use-case specific tool selection and execution.',
    },
    plan: {
      ...basePlan,
      stage: 'execution_ready',
    },
  };
}
