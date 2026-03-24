import type { AgentTask, WorkflowExecution, WorkflowStepResult } from '../../agents/shared/src/index.js';
import type { RuntimeConfig } from '../../config/src/index.js';
import { runMockDocumentWorkflow } from '../../tools/documents/src/index.js';
import { runMockFhirWorkflow } from '../../tools/fhir/src/index.js';
import { getUseCaseDefinition } from '../../use-cases/src/index.js';

export function executeWorkflow(task: AgentTask, _config: RuntimeConfig): WorkflowExecution {
  const definition = getUseCaseDefinition(task.useCase);

  if (!definition.autoExecutable || task.actionType !== 'read') {
    return {
      status: 'not_started',
      currentStage: 'execution_ready',
      steps: [],
      artifacts: [],
    };
  }

  const documentExecution = runMockDocumentWorkflow(task, {
    operation: definition.documentOperations[0],
  });
  const fhirExecution = runMockFhirWorkflow(
    task,
    definition.fhirResources.map((resourceType) => ({
      resourceType,
      operation: 'read',
      accessMode: 'read',
    }))
  );

  const steps: WorkflowStepResult[] = [
    ...documentExecution.steps.filter((step) => step.status === 'completed'),
    ...fhirExecution.steps,
    {
      stage: 'completed',
      status: 'completed',
      summary: `Workflow ${definition.workflow} completed in mock mode.`,
    },
  ];

  return {
    status: 'completed',
    currentStage: 'completed',
    steps,
    artifacts: [...documentExecution.artifacts, ...fhirExecution.artifacts],
  };
}
