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
- Phase 6: Evaluations and evidence packaging. Commit `49eaa23`
- Phase 7: Persistence boundary and operational hardening. Commit `e0da6d2`

## Current Phase

- Phase 8: Deployment and auth hardening
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
- Introduce a database repository boundary with a file-backed adapter as the default implementation
- Improve failure handling around persistence operations and API error surfaces

### Phase 8

- Add API-level client authentication for protected routes
- Harden production configuration so unsafe mock deployment defaults fail fast
- Add response security headers and request trace headers by default
- Expose auth and security posture through readiness and startup behavior

### Phase 9

- Add rate limiting, explicit CORS policy controls, and audit-friendly actor identity propagation
- Introduce stronger machine-to-machine authentication beyond shared API keys
- Add deployment manifests and environment-specific runbooks

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

## Phase 7 Verification Preview

- Verify audit and review persistence now flow through repository interfaces
- Verify persistence failures surface deterministic API errors instead of silent corruption
- Verify current file-backed adapter still works through the new database boundary

## Phase 8 Verification Preview

- Verify protected routes return `401` without API client credentials when auth is enabled
- Verify valid API client credentials succeed on protected routes
- Verify readiness exposes API auth and security-header posture for operators
