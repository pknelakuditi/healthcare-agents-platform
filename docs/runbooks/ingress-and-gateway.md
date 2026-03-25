# Ingress And Gateway Runbook

Use this runbook when the API sits behind a reverse proxy, ingress controller, or API gateway.

## Baseline Expectations

- terminate TLS at the ingress or gateway layer
- strip inbound client-supplied auth headers before forwarding
- inject only the headers the API is configured to trust
- enable `TRUST_PROXY=true` only when that reverse proxy path is actually in place

## Shared-Key Or HMAC Mode

- pass requests through without rewriting the application auth headers
- if using HMAC mode, forward:
  - `x-client-id`
  - `x-timestamp`
  - `x-nonce`
  - `x-signature`
- keep clocks synchronized so timestamp skew stays within `MAX_REQUEST_SIGNATURE_AGE_SECONDS`

## Gateway-Asserted Mode

Set:

- `REQUIRE_API_AUTHENTICATION=true`
- `API_AUTHENTICATION_MODE=gateway-asserted`
- `TRUST_PROXY=true`
- `GATEWAY_SHARED_SECRET=<shared-secret-between-gateway-and-app>`

Forward only trusted gateway assertions:

- `x-gateway-auth`
- `x-authenticated-client-id`
- `x-authenticated-user-id`
- `x-authenticated-scopes`

The ingress or gateway must:

- overwrite those headers on every request
- strip any copies supplied by outside clients
- restrict direct network access to the app so bypass traffic cannot inject fake gateway headers

## Rate Limiting And Replay Notes

- the current perimeter repositories are in-memory and per-process
- this is safe for single-instance local or early-stage deployments only
- multi-instance production deployments should replace them with a shared store before relying on global replay prevention or consistent throttling

## Verification

- `GET /ready` should report the selected auth mode and perimeter provider
- a replayed HMAC nonce should fail after one successful use
- gateway-asserted requests should fail if `TRUST_PROXY=false` or `GATEWAY_SHARED_SECRET` is missing
