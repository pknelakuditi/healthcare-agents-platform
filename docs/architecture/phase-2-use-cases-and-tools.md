# Phase 2 Use Cases And Tools

Phase 2 adds the first healthcare-specific modeling layer without binding the platform to a single vendor integration.

## Additions

- A use-case catalog with owner agent, workflow, capabilities, and allowed action mode
- Tool contracts for:
  - document operations
  - FHIR operations
- Richer workflow plans that expose:
  - workflow id
  - stage
  - owning agent
  - required capabilities
  - planned tool usage
  - blockers

## Why This Matters

The API can now explain not only whether a request is allowed, but also how the platform intends to process it. That makes routing observable, testable, and easier to evolve when real integrations are added in later phases.

## Guardrails

- Unsupported use-case/action combinations degrade into `unknown` routing instead of pretending the request is valid.
- Write-side use cases still stop in the human-review stage.
- PHI remains blocked when the environment flag disallows it.
