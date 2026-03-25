import type { RuntimeConfig } from '../../config/src/index.js';
import { MockDocumentProvider, type DocumentProvider } from '../../tools/documents/src/index.js';
import { MockFhirProvider, type FhirProvider } from '../../tools/fhir/src/index.js';

export interface IntegrationRegistry {
  documentProvider: DocumentProvider;
  fhirProvider: FhirProvider;
}

export function createIntegrationRegistry(_config: RuntimeConfig): IntegrationRegistry {
  return {
    documentProvider: new MockDocumentProvider(),
    fhirProvider: new MockFhirProvider(),
  };
}
