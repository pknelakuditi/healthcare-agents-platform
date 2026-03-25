# Phase 08 Deployment And Auth Hardening

## Objective

Harden the platform for production-shaped deployment by enforcing API caller authentication, tightening unsafe production configuration paths, and exposing clearer runtime security posture through readiness and startup behavior.

## Scope

- API client authentication for protected HTTP endpoints
- runtime config validation for production mode
- deployment-oriented security headers and request tracing headers
- readiness and documentation updates for the new controls

## Out Of Scope

- OAuth, SSO, or identity provider integration
- secret rotation or external secret managers
- Kubernetes, Terraform, or cloud-specific deployment manifests

## Deliverables

- config-backed API client authentication using shared secrets
- production guards that block unsafe mock OpenAI deployment defaults
- response security headers and request id propagation
- updated setup and manual verification instructions for secured API operation
- tests covering auth and config hardening behavior

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke checks:
  - verify `/ready` returns `401` without credentials when API authentication is enabled
  - verify `/ready` succeeds with valid `x-client-id` and `x-api-key` headers
  - verify readiness exposes auth and security posture metadata

## Commit Target

- `Phase 8 deployment and auth hardening`

## Follow-Up Items

- replace shared API keys with a stronger machine-to-machine auth mechanism
- move secrets to a dedicated secret manager
- add rate limiting and explicit CORS policy controls
