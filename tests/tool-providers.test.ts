import { describe, expect, it } from 'vitest';
import { runMockDocumentWorkflow } from '../packages/tools/documents/src/index.js';
import { runMockFhirWorkflow } from '../packages/tools/fhir/src/index.js';

describe('mock tool providers', () => {
  it('produces a summary artifact for document-summary requests', () => {
    const result = runMockDocumentWorkflow({
      requestId: 'doc-1',
      userId: 'user-1',
      useCase: 'document-summary',
      actionType: 'read',
      containsPhi: false,
      message: 'Summarize the packet.',
    });

    expect(result.steps.some((step) => step.stage === 'document_ingestion')).toBe(true);
    expect(result.artifacts.some((artifact) => artifact.kind === 'summary')).toBe(true);
  });

  it('produces FHIR artifacts for requested resources', () => {
    const result = runMockFhirWorkflow(
      {
        requestId: 'fhir-1',
        userId: 'user-1',
        useCase: 'intake',
        actionType: 'read',
        containsPhi: false,
        message: 'Load intake context.',
      },
      [
        {
          resourceType: 'Patient',
          operation: 'read',
          accessMode: 'read',
        },
        {
          resourceType: 'Coverage',
          operation: 'search',
          accessMode: 'read',
        },
      ]
    );

    expect(result.steps[0]?.stage).toBe('fhir_fetch');
    expect(result.artifacts).toHaveLength(2);
  });
});
