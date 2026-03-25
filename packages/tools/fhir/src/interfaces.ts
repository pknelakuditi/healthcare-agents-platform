import type { AgentTask } from '../../../agents/shared/src/index.js';
import type { FhirExecutionResult } from './provider.js';
import type { FhirToolRequest } from './contracts.js';

export interface FhirProvider {
  readonly providerName: string;
  execute(task: AgentTask, requests?: Partial<FhirToolRequest>[]): FhirExecutionResult;
}
