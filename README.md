# Healthcare Agents Platform

Production-oriented TypeScript foundation for healthcare agent workflows. The repository is organized as deployable apps plus shared domain packages so new agents, tools, safety checks, and integrations can be added without collapsing into prompt-driven spaghetti.

## Current Phase

Phase 8 hardens the runtime and deployment posture:

- API service with health, readiness, and orchestration endpoints
- Use-case catalog endpoint for supported workflows
- Mock tooling capability endpoint for document and FHIR adapters
- Audit event and review queue endpoints
- Reviewer authorization on approval and rejection endpoints
- Optional API client authentication for protected routes
- Production config guards that fail fast on unsafe mock/auth combinations
- Security headers and request-id propagation on API responses
- Eval summary endpoint and in-repo golden cases
- Worker and eval-runner entrypoints
- Shared configuration, logging, audit, orchestration, OpenAI, safety, use-case, and tool-contract packages
- Mock execution for `document-summary` and `intake`
- Human review and mock approval execution for `patient-outreach`
- Tests for orchestration, policy gating, config loading, API behavior, use-case routing, and mock providers
- Prompt logging discipline for every commit

## Repository Layout

```text
apps/
  api/             Fastify API surface
  worker/          Background process entrypoint
  eval-runner/     Offline evaluation entrypoint
packages/
  agents/          Agent contracts and orchestrator
  ai/openai/       OpenAI client wrapper
  config/          Runtime configuration and env parsing
  data/audit/      Audit event contracts and persistence
  observability/   Structured logging
  orchestration/   Workflow execution primitives
  review/          Human review queue and durable review storage
  auth/            Reviewer authorization checks
  integrations/    Provider registry for document and FHIR adapters
  evals/           Golden cases and scoring logic
  persistence/     Repository boundaries and persistence errors
  safety/          Policy and human-approval gates
  tools/           Typed contracts and mock providers for document and FHIR toolsets
  use-cases/       Healthcare workflow catalog
tests/             Platform tests
docs/architecture/ Phase notes and architectural decisions
prompt-log.md      Prompts used for each committed phase
```

## Planning Files

- `docs/roadmap.md`: durable multi-phase development plan
- `docs/phases/`: one file per phase with scope, verification, and follow-ups
- `docs/development-workflow.md`: mandatory process for future phases
- `prompt-log.md`: prompts and working interpretations used for each phase commit

## Prerequisites

- Node.js 18.3+
- npm 10+

## Setup

```bash
npm install
cp .env.example .env
```

Reviewer authorization is configured with `AUTHORIZED_REVIEWER_IDS`. Only those ids can approve or reject pending review requests.
Persistence is now accessed through repository interfaces, with a file-backed adapter as the default implementation.
Protected routes can require machine-to-machine credentials with `REQUIRE_API_AUTHENTICATION=true` and `API_CLIENT_KEYS=client-id:long-shared-secret`.

If you plan to send real traffic to OpenAI, set `OPENAI_API_KEY` and review the healthcare compliance posture before enabling PHI-related flows. Keep `ALLOW_PHI_WITH_OPENAI=false` until legal, security, and vendor agreements are in place.
In production, the runtime now fails fast if API authentication is disabled or if mock OpenAI remains enabled without an explicit override.

## Run

Start the API in watch mode:

```bash
npm run dev:api
```

Start the worker:

```bash
npm run dev:worker
```

Run the eval runner:

```bash
npm run dev:eval-runner
```

Build for production:

```bash
npm run build
```

Start built services:

```bash
npm run start:api
npm run start:worker
npm run start:eval-runner
```

## Test

Run all automated checks:

```bash
npm run verify
```

Run tests only:

```bash
npm test
```

Watch tests during development:

```bash
npm run test:watch
```

## Test Features Manually

1. Start the API with `npm run dev:api`.
2. Check liveness:

```bash
curl http://localhost:3000/health
```

3. Check readiness:

```bash
curl http://localhost:3000/ready
```

If API authentication is enabled, use:

```bash
curl http://localhost:3000/ready \
  -H "x-client-id: ops-client" \
  -H "x-api-key: replace-with-your-shared-secret"
```

4. Inspect supported healthcare use cases:

```bash
curl http://localhost:3000/v1/use-cases
```

5. Inspect mock tool capabilities:

```bash
curl http://localhost:3000/v1/tooling/mock-capabilities
```

6. Exercise orchestration with a safe read-only request:

```bash
curl -X POST http://localhost:3000/v1/orchestrate \
  -H "content-type: application/json" \
  -d '{
    "requestId": "demo-read-1",
    "userId": "ops-user",
    "useCase": "document-summary",
    "actionType": "read",
    "containsPhi": false,
    "message": "Summarize the uploaded prior authorization packet."
  }'
```

7. Exercise a read-only intake request that should execute the mock pipeline:

```bash
curl -X POST http://localhost:3000/v1/orchestrate \
  -H "content-type: application/json" \
  -d '{
    "requestId": "demo-intake-1",
    "userId": "ops-user",
    "useCase": "intake",
    "actionType": "read",
    "containsPhi": false,
    "message": "Normalize the intake packet and verify eligibility context."
  }'
```

8. Exercise a write request that should be held for approval:

```bash
curl -X POST http://localhost:3000/v1/orchestrate \
  -H "content-type: application/json" \
  -d '{
    "requestId": "demo-write-1",
    "userId": "ops-user",
    "useCase": "patient-outreach",
    "actionType": "write",
    "containsPhi": false,
    "message": "Send a reminder to the patient."
  }'
```

The intake request should return completed mock execution artifacts. The write request should return `held_for_human_review` while approval is required.

9. List pending reviews:

```bash
curl http://localhost:3000/v1/reviews
```

10. Approve a pending review:

```bash
curl -X POST http://localhost:3000/v1/reviews/<review-id>/approve \
  -H "content-type: application/json" \
  -d '{
    "reviewerId": "supervisor-1",
    "comments": "Approved for mock execution."
  }'
```

An approval with a reviewer id outside `AUTHORIZED_REVIEWER_IDS` should return `403`.

11. Inspect persisted audit events:

```bash
curl http://localhost:3000/v1/audit/events
```

12. Inspect the current eval summary:

```bash
curl http://localhost:3000/v1/evals/summary
```

13. For `document-summary`, inspect the returned `evidence-package` artifact in the orchestration response.

14. Confirm readiness reports the active persistence provider:

```bash
curl http://localhost:3000/ready
```

When API authentication is enabled, confirm unauthenticated readiness calls fail with `401` and authenticated calls report:

- `apiAuthenticationRequired`
- `configuredApiClientCount`
- `securityHeadersEnabled`
- `trustProxy`

## Production Notes

- Set `REQUIRE_API_AUTHENTICATION=true` and provide at least one `API_CLIENT_KEYS` entry before production deployment.
- Keep `ALLOW_MOCK_OPENAI_IN_PRODUCTION=false` unless you are deliberately running a non-production-like environment.
- Set `TRUST_PROXY=true` only when the service is actually behind a trusted reverse proxy or load balancer.
- `/health` remains public for liveness checks; other endpoints can be protected with shared API client credentials.

- All agent-facing actions should remain behind typed contracts.
- Audit records should be emitted for every externally visible workflow step.
- Any future EHR, scheduling, billing, or messaging write path must keep the human-approval gate.
- Add citations, eval datasets, and access controls before enabling clinical-facing use cases.
