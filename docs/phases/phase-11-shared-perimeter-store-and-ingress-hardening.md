# Phase 11 Shared Perimeter Store And Ingress Hardening

## Objective

Replace the current single-process perimeter state with a deployment-safe shared backing store and tighten the ingress assumptions around gateway-managed authentication.

## Scope

- shared backing store for rate limiting and replay protection
- perimeter repository implementations that can be used across multiple app instances
- stronger ingress and gateway deployment guidance
- readiness visibility for the active perimeter backing store

## Out Of Scope

- full identity-provider integration
- workload identity or mTLS
- complete cloud-provider-specific ingress templates

## Deliverables

- shared-store perimeter repository implementation
- app wiring to select the shared perimeter store through config
- updated ingress and gateway runbook coverage for multi-instance deployment
- tests for cross-instance rate limiting and replay protection behavior

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke checks:
  - verify replay protection blocks nonce reuse across two app instances
  - verify rate limiting behaves consistently when requests alternate across app instances
  - verify readiness exposes the selected perimeter store provider

## Commit Target

- `Phase 11 shared perimeter store and ingress hardening`

## Follow-Up Items

- replace shared secrets with stronger identity-backed assertions
- add deployment manifests that provision the shared perimeter backing store
- extend gateway validation with stricter header provenance controls
