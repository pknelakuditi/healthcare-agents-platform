# Phase 07 Persistence Boundary And Operational Hardening

## Objective

Introduce a production-shaped persistence boundary so storage can move to a real database later without rewriting the API and review flows, while also tightening failure handling around state changes.

## Scope

- repository interfaces for audit and review persistence
- file-backed repository adapter as the default implementation
- configuration and service wiring through the repository boundary
- clearer persistence error handling in API routes

## Out Of Scope

- real Postgres or managed database integration
- deployment-specific infrastructure code
- telemetry backend integration

## Deliverables

- persistence repository interfaces
- file-backed repository implementations behind those interfaces
- service and API refactor to depend on repository abstractions
- tests for persistence error handling and happy-path behavior

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke check:
  - create and approve a review request through the new persistence boundary
  - verify persisted audit and review records still read back correctly

## Commit Target

- `Phase 7 persistence boundary and hardening`

## Follow-Up Items

- add Postgres-backed repository implementations
- add migrations and connection lifecycle management
- add metrics and alerting on persistence failures
