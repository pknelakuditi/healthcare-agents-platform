# Phase 04 Review Queue And Persistence

## Objective

Add durable state and approval controls for write-side workflows.

## Scope

- file-backed audit persistence
- file-backed review queue persistence
- approval and rejection endpoints
- approved execution path for `patient-outreach`

## Out Of Scope

- real authentication
- database-backed persistence
- real messaging or EHR integrations

## Deliverables

- audit event storage and retrieval
- review queue storage and retrieval
- approval/rejection APIs
- mock execution after approval

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke checks for review creation, approval, and audit event persistence

## Commit Target

- `7d1fe53` `Phase 4 review queue and persistence`

## Follow-Up Items

- add reviewer authz
- replace file stores with database-backed persistence
- add integration boundaries for real providers
