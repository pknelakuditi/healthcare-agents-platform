# Phase 10 Externalized Perimeter State And Gateway Auth

## Objective

Start moving API edge controls toward a deployment-grade shape by separating replay and rate-limit state behind repository boundaries and adding a gateway-oriented authentication mode for ingress-managed deployments.

## Scope

- repository boundaries for replay protection and rate limiting
- nonce-based replay protection for HMAC request authentication
- gateway-asserted authentication mode for trusted reverse-proxy deployments
- deployment runbook guidance for ingress and gateway setups

## Out Of Scope

- Redis- or database-backed perimeter state stores
- OAuth, mTLS, or workload identity integration
- cloud-specific ingress manifests

## Deliverables

- perimeter repository package with injectable rate-limit and replay repositories
- HMAC nonce replay protection through the new repository boundary
- `gateway-asserted` auth mode with explicit config guards
- gateway and ingress runbook documentation
- tests for replay protection, gateway auth, and perimeter repositories

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke checks:
  - verify a signed HMAC request succeeds once and a replayed nonce fails
  - verify gateway-asserted readiness succeeds with trusted gateway headers
  - verify readiness exposes the perimeter state provider

## Commit Target

- `Phase 10 externalized perimeter state and gateway auth`

## Follow-Up Items

- replace in-memory perimeter repositories with Redis or database-backed implementations
- move gateway auth to stronger identity-backed assertions from a real ingress or service mesh
- add deployment manifests and operational checks for gateway header stripping
