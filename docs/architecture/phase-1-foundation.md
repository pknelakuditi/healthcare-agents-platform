# Phase 1 Foundation

Phase 1 establishes a controlled platform baseline rather than jumping directly into healthcare business logic.

## Decisions

- Use a single TypeScript repository with `apps/` and `packages/` folders.
- Keep the OpenAI integration behind a single package boundary.
- Add policy gating before any real healthcare write action exists.
- Make orchestration deterministic and typed before adding more agents.
- Require prompt logging for every commit.

## Included Services

- `apps/api`: HTTP surface for health checks and orchestration
- `apps/worker`: background runner placeholder with production logging
- `apps/eval-runner`: regression harness entrypoint

## Included Packages

- `packages/config`: env parsing and runtime config
- `packages/observability`: logger factory
- `packages/data/audit`: audit contracts and helpers
- `packages/safety`: policy decisions and approval gates
- `packages/orchestration`: workflow runner primitives
- `packages/agents/*`: shared contracts and orchestrator routing logic
- `packages/ai/openai`: OpenAI client wrapper

## What Comes Next

- Phase 2: healthcare use case contracts, FHIR and document tool interfaces, richer orchestration states
- Phase 3: retrieval, citations, and evaluation datasets
- Phase 4: human review queue, access controls, and deployment hardening
