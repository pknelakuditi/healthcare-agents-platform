# Roadmap

This file is the durable development plan for the repository. Update it at the start and end of every phase.

## Vision

Build a production-oriented healthcare agents platform with:

- typed workflows and tool boundaries
- safe handling of read and write paths
- human review for risky actions
- durable auditability
- progressive replacement of mock providers with real integrations
- strong verification and operational runbooks

## Non-Goals For The Current Milestone

- direct production EHR writes
- PHI-enabled OpenAI flows without legal and security approval
- full authentication and authorization stack
- deployment-specific infrastructure for every environment

## Completed Phases

- Phase 1: Foundation scaffold. Commit `cae4049`
- Phase 2: Use-case and tool modeling. Commit `d7852f8`
- Phase 3: Mock execution adapters. Commit `e85bfef`
- Phase 4: Review queue and persistence. Commit `7d1fe53`
- Phase 5: Integration boundaries and reviewer authz. Commit `d1fdcc2`

## Current Phase

- Phase 6: Evaluations and evidence packaging
- Status: in progress

## Planned Phases

### Phase 5

- Add real integration boundaries for FHIR and document adapters
- Add reviewer authentication and authorization checks
- Separate operational roles for requesters and approvers
- Add configuration-backed reviewer allowlists and actor roles
- Keep mock providers as the default implementation behind the new interfaces

### Phase 6

- Add evaluation datasets, golden outputs, and regression scoring
- Add citations and evidence packaging for document workflows
- Add richer failure handling and retry semantics
- Add explicit API visibility for eval runs and evidence-bearing outputs

### Phase 7

- Replace file-backed persistence with production-grade database storage
- Add deployment configuration, environment hardening, and runbooks
- Add telemetry and alerting coverage for workflow failures

## Cross-Cutting Requirements

- Every phase must update:
  - `docs/roadmap.md`
  - the relevant `docs/phases/phase-0N-*.md`
  - `prompt-log.md`
- Every phase must pass:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
- Every phase should include manual verification notes for user-visible features.

## Phase 5 Verification Preview

- Verify reviewer approval requires an allowed reviewer id
- Verify unauthorized approval attempts fail cleanly
- Verify orchestration continues to use mock providers through the new adapter interfaces

## Phase 6 Verification Preview

- Verify eval runs report pass/fail summaries against golden cases
- Verify `document-summary` returns evidence packages with citations
- Verify eval endpoints expose current mock quality gates
