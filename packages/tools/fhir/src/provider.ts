import type { AgentTask, WorkflowArtifact, WorkflowStepResult } from '../../../agents/shared/src/index.js';
import type { FhirResourceType, FhirToolRequest } from './index.js';
import type { FhirProvider } from './interfaces.js';

function buildMockResources(resourceType: FhirResourceType, task: AgentTask): Record<string, unknown>[] {
  switch (resourceType) {
    case 'Patient':
      return [
        {
          id: `patient-${task.requestId}`,
          display: 'Mock Patient',
          active: true,
        },
      ];
    case 'Coverage':
      return [
        {
          id: `coverage-${task.requestId}`,
          payor: 'Mock Health Plan',
          status: 'active',
        },
      ];
    case 'Appointment':
      return [
        {
          id: `appointment-${task.requestId}`,
          status: 'booked',
          description: 'Follow-up visit',
        },
      ];
    default:
      return [
        {
          id: `${resourceType.toLowerCase()}-${task.requestId}`,
          status: 'mocked',
          resourceType,
        },
      ];
  }
}

export interface FhirExecutionResult {
  steps: WorkflowStepResult[];
  artifacts: WorkflowArtifact[];
}

export function runMockFhirWorkflow(
  task: AgentTask,
  requests: Partial<FhirToolRequest>[] = []
): FhirExecutionResult {
  const normalizedRequests = requests.length > 0
    ? requests
    : [{ resourceType: 'Patient', operation: 'read', accessMode: task.actionType }];

  const artifacts: WorkflowArtifact[] = normalizedRequests.map((request, index) => {
    const resourceType = (request.resourceType ?? 'Patient') as FhirResourceType;
    return {
      kind: 'fhir',
      id: `${task.requestId}:fhir:${resourceType}:${index + 1}`,
      label: `${resourceType} mock response`,
      data: {
        operation: request.operation ?? 'read',
        accessMode: request.accessMode ?? task.actionType,
        resources: buildMockResources(resourceType, task),
      },
    };
  });

  return {
    steps: [
      {
        stage: 'fhir_fetch',
        status: 'completed',
        summary: `Fetched ${artifacts.length} mock FHIR resource bundle(s) for ${task.useCase}.`,
      },
    ],
    artifacts,
  };
}

export class MockFhirProvider implements FhirProvider {
  readonly providerName = 'mock-fhir';

  execute(task: AgentTask, requests: Partial<FhirToolRequest>[] = []): FhirExecutionResult {
    return runMockFhirWorkflow(task, requests);
  }
}
