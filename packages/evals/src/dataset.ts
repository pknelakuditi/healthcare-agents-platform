import type { UseCase } from '../../agents/shared/src/index.js';

export interface EvalCase {
  id: string;
  useCase: UseCase;
  expectedExecutionStatus: 'completed' | 'not_started';
  expectedArtifacts: Array<'summary' | 'classification' | 'document' | 'fhir' | 'evidence-package'>;
  expectedDecisionStatus: 'accepted' | 'held_for_human_review' | 'rejected';
}

export const evalDataset: EvalCase[] = [
  {
    id: 'eval-document-summary',
    useCase: 'document-summary',
    expectedExecutionStatus: 'completed',
    expectedArtifacts: ['summary', 'document', 'fhir', 'evidence-package'],
    expectedDecisionStatus: 'accepted',
  },
  {
    id: 'eval-intake',
    useCase: 'intake',
    expectedExecutionStatus: 'completed',
    expectedArtifacts: ['classification', 'document', 'fhir'],
    expectedDecisionStatus: 'accepted',
  },
  {
    id: 'eval-patient-outreach',
    useCase: 'patient-outreach',
    expectedExecutionStatus: 'not_started',
    expectedArtifacts: [],
    expectedDecisionStatus: 'held_for_human_review',
  },
];
