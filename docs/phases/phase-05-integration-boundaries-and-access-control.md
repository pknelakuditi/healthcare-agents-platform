# Phase 05 Integration Boundaries And Access Control

## Objective

Introduce stable provider interfaces for future real integrations and lock down reviewer actions with explicit authorization checks.

## Scope

- document provider interface with mock implementation behind it
- FHIR provider interface with mock implementation behind it
- adapter registry / resolver for orchestration execution
- reviewer role and allowlist configuration
- authorization checks on review approval and rejection endpoints

## Out Of Scope

- live vendor integrations
- OAuth or SSO
- production-grade identity management
- database-backed RBAC

## Deliverables

- provider abstractions that decouple orchestration from mock implementations
- config-driven reviewer allowlist
- authorization guard for review actions
- tests covering authorized and unauthorized review paths

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke check:
  - create a review request
  - attempt approval with unauthorized reviewer id and confirm failure
  - approve with authorized reviewer id and confirm completion

## Commit Target

- `Phase 5 integration boundaries and reviewer authz`

## Follow-Up Items

- replace mock adapters with real document and FHIR integrations
- move reviewer authorization to a real identity provider
- add audit coverage for authorization failures
