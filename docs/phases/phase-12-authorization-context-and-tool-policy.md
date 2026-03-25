# Phase 12 Authorization Context And Tool Policy

## Objective

Carry authenticated actor identity and granted scopes through the platform so workflow execution, tool access, and audit trails can enforce and explain authorization decisions.

## Scope

- actor identity and scope propagation from the API edge into orchestration
- workflow and tool policy checks based on authenticated scopes
- audit enrichment with authenticated actor metadata
- clear denial paths for insufficient authorization context

## Out Of Scope

- human user login flows
- full RBAC administration UI
- external policy engines

## Deliverables

- shared authorization-context model
- orchestration and tool checks that enforce scopes on sensitive actions
- audit events enriched with authenticated actor and scope metadata
- tests for allowed and denied execution paths under different scope sets

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke checks:
  - verify a scoped actor can execute allowed read workflows
  - verify insufficient scopes block protected write or review actions
  - verify audit events include the propagated actor context

## Commit Target

- `Phase 12 authorization context and tool policy`

## Follow-Up Items

- integrate authorization context with a stronger external identity source
- add policy coverage for downstream integration adapters
- expose authorization diagnostics in operational tooling
