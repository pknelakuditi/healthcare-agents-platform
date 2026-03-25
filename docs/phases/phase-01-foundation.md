# Phase 01 Foundation

## Objective

Create the production-oriented monorepo baseline for the healthcare agents platform.

## Scope

- API, worker, and eval-runner entrypoints
- shared config, logging, orchestration, safety, audit, and OpenAI boundaries
- initial tests and CI
- prompt logging

## Out Of Scope

- healthcare-specific workflow modeling
- executable tool adapters
- human review flow

## Deliverables

- baseline repository scaffold
- health and readiness endpoints
- initial orchestration endpoint
- repository docs and run/test instructions

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- manual API health checks

## Commit Target

- `cae4049` `Phase 1 foundation scaffold`

## Follow-Up Items

- add healthcare use-case catalog
- add typed tool contracts
- add execution beyond static planning
