# Phase 06 Evaluations And Evidence Packaging

## Objective

Add a durable evaluation harness and evidence-bearing outputs for document workflows so behavior can be tested and inspected instead of trusted implicitly.

## Scope

- eval datasets and golden cases for current mock workflows
- scoring logic for pass/fail evaluation
- eval runner updates and API visibility for eval summaries
- evidence package artifacts for `document-summary`

## Out Of Scope

- model-based grading
- production telemetry dashboards
- real citation extraction from external systems

## Deliverables

- in-repo eval datasets
- evaluation scorer and summary model
- API endpoint for eval results
- evidence package in document-summary execution artifacts

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- live smoke check:
  - run document-summary orchestration and confirm evidence packaging
  - fetch eval summary endpoint and confirm pass/fail aggregation

## Commit Target

- `Phase 6 evaluations and evidence packaging`

## Follow-Up Items

- tie eval summaries into CI thresholds
- upgrade evidence packaging from mock citations to real extracted evidence
- add failure classification and richer retry semantics
