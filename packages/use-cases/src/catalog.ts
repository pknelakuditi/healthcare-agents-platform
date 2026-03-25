import type { ActionType, UseCase } from '../../agents/shared/src/index.js';
import type { DocumentOperation } from '../../tools/documents/src/index.js';
import type { FhirResourceType } from '../../tools/fhir/src/index.js';

export interface UseCaseDefinition {
  useCase: UseCase;
  actionType: ActionType;
  owningAgent: string;
  workflow: string;
  summary: string;
  requiredCapabilities: string[];
  documentOperations: DocumentOperation[];
  fhirResources: FhirResourceType[];
  autoExecutable: boolean;
}

const useCaseCatalog: Record<UseCase, UseCaseDefinition> = {
  'document-summary': {
    useCase: 'document-summary',
    actionType: 'read',
    owningAgent: 'docs-agent',
    workflow: 'document-summary',
    summary: 'Extract and summarize inbound clinical or administrative documents.',
    requiredCapabilities: ['document-intake', 'citation-generation'],
    documentOperations: ['ingest', 'extract', 'summarize', 'classify'],
    fhirResources: ['DocumentReference', 'Encounter'],
    autoExecutable: true,
  },
  intake: {
    useCase: 'intake',
    actionType: 'read',
    owningAgent: 'intake-agent',
    workflow: 'patient-intake',
    summary: 'Collect and normalize intake information before downstream routing.',
    requiredCapabilities: ['document-intake', 'eligibility-check'],
    documentOperations: ['ingest', 'extract', 'classify'],
    fhirResources: ['Patient', 'Coverage', 'Appointment'],
    autoExecutable: true,
  },
  triage: {
    useCase: 'triage',
    actionType: 'read',
    owningAgent: 'triage-agent',
    workflow: 'clinical-triage',
    summary: 'Classify urgency and route de-identified cases for next action.',
    requiredCapabilities: ['triage-policy', 'care-routing'],
    documentOperations: ['extract', 'summarize'],
    fhirResources: ['Condition', 'Observation', 'Encounter'],
    autoExecutable: false,
  },
  'patient-outreach': {
    useCase: 'patient-outreach',
    actionType: 'write',
    owningAgent: 'messaging-agent',
    workflow: 'patient-outreach',
    summary: 'Draft and schedule patient-facing communications.',
    requiredCapabilities: ['message-composition', 'approval-gate'],
    documentOperations: ['generate-letter'],
    fhirResources: ['Patient', 'Appointment'],
    autoExecutable: true,
  },
  'coding-review': {
    useCase: 'coding-review',
    actionType: 'read',
    owningAgent: 'coding-agent',
    workflow: 'coding-review',
    summary: 'Review clinical documentation for coding support and gaps.',
    requiredCapabilities: ['coding-inference', 'documentation-check'],
    documentOperations: ['extract', 'summarize', 'classify'],
    fhirResources: ['Condition', 'Observation', 'Encounter', 'DocumentReference'],
    autoExecutable: false,
  },
  unknown: {
    useCase: 'unknown',
    actionType: 'read',
    owningAgent: 'qa-agent',
    workflow: 'manual-triage',
    summary: 'Fallback bucket for unsupported or unclear workflows.',
    requiredCapabilities: ['manual-review'],
    documentOperations: [],
    fhirResources: [],
    autoExecutable: false,
  },
};

export function getUseCaseDefinition(useCase: UseCase): UseCaseDefinition {
  return useCaseCatalog[useCase];
}

export function listUseCaseDefinitions(): UseCaseDefinition[] {
  return Object.values(useCaseCatalog);
}
