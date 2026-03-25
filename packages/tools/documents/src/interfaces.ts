import type { AgentTask } from '../../../agents/shared/src/index.js';
import type { DocumentExecutionResult } from './provider.js';
import type { DocumentToolRequest } from './contracts.js';

export interface DocumentProvider {
  readonly providerName: string;
  execute(task: AgentTask, request?: Partial<DocumentToolRequest>): DocumentExecutionResult;
}
