# Phase 3 Mock Execution

Phase 3 turns planning into execution for the first safe workflows.

## Implemented

- Mock document provider for:
  - ingestion
  - summarization
  - intake classification
- Mock FHIR provider for read-only resource fetches
- Execution engine that runs automatically for:
  - `document-summary`
  - `intake`
- API visibility for mock tool capabilities and execution artifacts

## Execution Model

Accepted read-only requests can now move through explicit stages:

1. `document_ingestion`
2. `fhir_fetch`
3. `summarization` or `classification` depending on the use case
4. `completed`

Write workflows and blocked workflows still return plans without execution.

## Why Mock Providers First

- Keep contracts stable before vendor integration work
- Allow API, audit, and orchestration layers to evolve with deterministic tests
- Make later replacement with real FHIR and document adapters a narrow implementation change
