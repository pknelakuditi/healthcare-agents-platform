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
- Phase 8: Deployment and auth hardening. Commit `99a6bcc`
- Phase 9: Perimeter controls and machine auth. Commit `171d20c`
- Phase 10: Externalized perimeter state and gateway auth. Commit `f199b6f`

## Current Phase

- Planning next implementation phases
- Status: queued

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

### Phase 10

- move rate limiting and replay protection to a shared external store
- add deployment-oriented ingress and gateway runbooks
- strengthen actor identity propagation and downstream authorization context

### Phase 11

- replace in-memory perimeter state with a multi-instance-safe backing store
- tighten gateway identity assertions and downstream service authorization context
- add deployment manifests and environment-specific ingress checks

### Phase 12

- add service-to-service authorization context propagation
- constrain tool access by actor identity and granted scopes
- persist and audit authenticated actor metadata end to end

### Phase 13

- add deployment manifests and environment overlays for api, worker, and eval-runner
- document operational readiness, rollback, and secret rotation procedures
- expand readiness signals and runbooks for production deployment gates

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

## Phase 9 Verification Preview

- Verify allowed origins receive successful preflight handling while disallowed origins fail cleanly
- Verify repeated requests return `429` with retry guidance when the limit is exceeded
- Verify HMAC-signed readiness requests succeed in signed-request mode

## Phase 10 Verification Preview

- Verify replayed HMAC nonces fail cleanly after the first successful request
- Verify gateway-asserted authentication works only with the required trusted-proxy settings
- Verify readiness reports the perimeter state provider in use

## Phase 11 Verification Preview

- Verify rate limiting stays consistent across multiple app instances through a shared backing store
- Verify replay protection blocks nonce reuse across instances, not just within one process
- Verify gateway-specific deployment assumptions are reflected in the updated runbooks

## Phase 12 Verification Preview

- Verify authenticated actor identity and scopes propagate into workflow execution and audit events
- Verify tool or workflow access is denied when actor scopes do not permit the requested action
- Verify readiness or diagnostics expose the active authorization-context mode

## Phase 13 Verification Preview

- Verify deployment manifests start all required services with the documented config
- Verify operational runbooks cover deploy, rollback, and secret rotation paths
- Verify production readiness checks align with the deployment documentation
