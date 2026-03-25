# Phase 09 Perimeter Controls And Machine Auth

## Objective

Add stronger perimeter controls around the API so deployments have explicit origin policy, deterministic request throttling, and a machine-to-machine authentication mode that is stronger than shared API keys alone.

## Scope

- fixed-window API rate limiting
- explicit CORS allowlist handling and preflight responses
- HMAC-signed request authentication mode
- readiness and documentation updates for the new perimeter posture

## Out Of Scope

- OAuth client credentials or mTLS
- distributed rate limiting backed by Redis or an API gateway
- cloud load balancer or ingress configuration

## Deliverables

- config-backed rate limiting at the API edge
- config-backed CORS enforcement with allowlisted origins
- HMAC request-signing support alongside shared-key auth
- tests and manual verification guidance for the new controls

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke checks:
  - verify `OPTIONS /ready` succeeds for an allowed origin when CORS is enabled
  - verify repeated requests return `429` when the configured rate limit is exceeded
  - verify a signed `GET /ready` request succeeds in `hmac-signature` mode

## Commit Target

- `Phase 9 perimeter controls and machine auth`

## Follow-Up Items

- move rate limiting to a shared external store for multi-instance deployments
- replace HMAC signing with a stronger identity-backed machine auth mechanism
- add deployment-specific ingress and gateway policy documentation
