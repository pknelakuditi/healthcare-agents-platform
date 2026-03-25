import type { AgentTask } from '../../agents/shared/src/index.js';
import type { RuntimeConfig } from '../../config/src/index.js';
import { routeAgentTask } from '../../agents/orchestrator/src/index.js';
import { evalDataset, type EvalCase } from './dataset.js';

export interface EvalResult {
  evalCase: EvalCase;
  passed: boolean;
  reasons: string[];
}

export interface EvalSummary {
  total: number;
  passed: number;
  failed: number;
  results: EvalResult[];
}

function buildTaskFromEvalCase(evalCase: EvalCase): AgentTask {
  return {
    requestId: evalCase.id,
    userId: 'eval-user',
    useCase: evalCase.useCase,
    actionType: evalCase.useCase === 'patient-outreach' ? 'write' : 'read',
    containsPhi: false,
    message: `Evaluation case for ${evalCase.useCase}.`,
  };
}

export function runEvaluations(config: RuntimeConfig): EvalSummary {
  const results = evalDataset.map((evalCase) => {
    const task = buildTaskFromEvalCase(evalCase);
    const routed = routeAgentTask(task, config);
    const reasons: string[] = [];

    if (routed.decision.status !== evalCase.expectedDecisionStatus) {
      reasons.push(
        `Expected decision status ${evalCase.expectedDecisionStatus} but received ${routed.decision.status}.`
      );
    }

    if (routed.execution.status !== evalCase.expectedExecutionStatus) {
      reasons.push(
        `Expected execution status ${evalCase.expectedExecutionStatus} but received ${routed.execution.status}.`
      );
    }

    for (const artifactKind of evalCase.expectedArtifacts) {
      const present = routed.execution.artifacts.some((artifact) => artifact.kind === artifactKind);
      if (!present) {
        reasons.push(`Missing expected artifact kind: ${artifactKind}.`);
      }
    }

    return {
      evalCase,
      passed: reasons.length === 0,
      reasons,
    };
  });

  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    failed: results.filter((result) => !result.passed).length,
    results,
  };
}
