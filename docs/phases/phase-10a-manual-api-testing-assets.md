# Phase 10A Manual API Testing Assets

## Objective

Add a reusable manual-testing artifact for the current API so operators and developers can exercise the platform without rebuilding curl commands by hand.

## Scope

- Postman-compatible collection for the current API routes
- local Postman environment with editable variables for auth and workflow testing
- README guidance for importing and using the manual-testing assets

## Out Of Scope

- OpenAPI generation
- automated API contract validation
- Newman-based CI execution of the manual test collection

## Deliverables

- Postman collection covering health, readiness, orchestration, review, audit, and eval routes
- Postman environment file with configurable local defaults
- request scripts that help compute HMAC headers and capture review ids for approval and rejection flows
- updated manual-testing documentation in the README

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- `node -e "JSON.parse(require('node:fs').readFileSync('postman/healthcare-agents-platform.postman_collection.json', 'utf8')); JSON.parse(require('node:fs').readFileSync('postman/local.postman_environment.json', 'utf8'))"`
- manual verification:
  - import the collection and environment into Postman
  - run the read orchestration request and confirm it succeeds with local defaults
  - run the gated write request, then list reviews and approve or reject it using the captured `reviewId`

## Commit Target

- `Phase 10A manual API testing assets`

## Follow-Up Items

- add an OpenAPI document if the API surface becomes large enough to justify generated clients
- add Newman or equivalent collection validation to CI once the manual flows stabilize
- add environment variants for authenticated shared-key, HMAC, and gateway smoke checks
