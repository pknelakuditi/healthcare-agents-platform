import type { AgentTask, WorkflowArtifact, WorkflowStepResult } from '../../../agents/shared/src/index.js';
import type { DocumentReference, DocumentToolRequest } from './index.js';

function createDefaultReferences(task: AgentTask): DocumentReference[] {
  return [
    {
      documentId: `${task.requestId}-source-1`,
      sourceType: 'upload',
      mimeType: 'application/pdf',
      description: `${task.useCase} source document`,
    },
  ];
}

export interface DocumentExecutionResult {
  steps: WorkflowStepResult[];
  artifacts: WorkflowArtifact[];
}

export function runMockDocumentWorkflow(
  task: AgentTask,
  request: Partial<DocumentToolRequest> = {}
): DocumentExecutionResult {
  const references = request.references && request.references.length > 0
    ? request.references
    : createDefaultReferences(task);

  const steps: WorkflowStepResult[] = [
    {
      stage: 'document_ingestion',
      status: 'completed',
      summary: `Ingested ${references.length} document reference(s) for ${task.useCase}.`,
    },
    {
      stage: 'summarization',
      status: task.useCase === 'document-summary' ? 'completed' : 'skipped',
      summary:
        task.useCase === 'document-summary'
          ? 'Generated a mock summary with citation placeholders.'
          : 'Summarization not required for this use case.',
    },
    {
      stage: 'classification',
      status: task.useCase === 'intake' ? 'completed' : 'skipped',
      summary:
        task.useCase === 'intake'
          ? 'Classified intake packet as ready for downstream verification.'
          : 'Classification not required for this use case.',
    },
  ];

  const artifacts: WorkflowArtifact[] = [
    {
      kind: 'document',
      id: `${task.requestId}:document-bundle`,
      label: 'Normalized document bundle',
      data: {
        references,
        operation: request.operation ?? 'extract',
      },
    },
  ];

  if (task.useCase === 'document-summary') {
    artifacts.push({
      kind: 'summary',
      id: `${task.requestId}:summary`,
      label: 'Mock document summary',
      data: {
        text: `Summary for request ${task.requestId}: extracted key facts from ${references[0]?.description ?? 'the source document'}.`,
        citations: references.map((reference) => reference.documentId),
      },
    });
  }

  if (task.useCase === 'intake') {
    artifacts.push({
      kind: 'classification',
      id: `${task.requestId}:intake-classification`,
      label: 'Mock intake classification',
      data: {
        queue: 'intake-verification',
        confidence: 0.93,
        rationale: 'Required intake fields and supporting documents are present in the mock dataset.',
      },
    });
  }

  return {
    steps,
    artifacts,
  };
}
