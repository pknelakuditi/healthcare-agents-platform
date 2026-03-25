import type { AgentTask, WorkflowExecution, WorkflowStepResult } from '../../agents/shared/src/index.js';
import type { RuntimeConfig } from '../../config/src/index.js';
import { createIntegrationRegistry } from '../../integrations/src/index.js';
import { getUseCaseDefinition } from '../../use-cases/src/index.js';

export function executeWorkflow(task: AgentTask, config: RuntimeConfig): WorkflowExecution {
  const definition = getUseCaseDefinition(task.useCase);
  const integrations = createIntegrationRegistry(config);

  if (!definition.autoExecutable || task.actionType !== 'read') {
    if (!(definition.autoExecutable && task.useCase === 'patient-outreach' && task.actionType === 'write')) {
      return {
        status: 'not_started',
        currentStage: 'execution_ready',
        steps: [],
        artifacts: [],
      };
    }
  }

  if (task.useCase === 'patient-outreach') {
    const documentExecution = integrations.documentProvider.execute(task, {
      operation: 'generate-letter',
    });
    const fhirExecution = integrations.fhirProvider.execute(task, [
      {
        resourceType: 'Patient',
        operation: 'read',
        accessMode: 'write',
      },
      {
        resourceType: 'Appointment',
        operation: 'read',
        accessMode: 'write',
      },
    ]);

    return {
      status: 'completed',
      currentStage: 'completed',
      steps: [
        ...documentExecution.steps.filter((step) => step.status === 'completed'),
        ...fhirExecution.steps,
        {
          stage: 'completed',
          status: 'completed',
          summary: 'Patient outreach package generated in mock mode after approval.',
        },
      ],
      artifacts: [...documentExecution.artifacts, ...fhirExecution.artifacts],
    };
  }

  const documentExecution = integrations.documentProvider.execute(task, {
    operation: definition.documentOperations[0],
  });
  const fhirExecution = integrations.fhirProvider.execute(
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
