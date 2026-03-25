# Phase 4 Human Review And Persistence

Phase 4 adds the minimum operational controls required for write-side workflows.

## Added

- Durable JSON-backed audit event storage
- Durable JSON-backed review request storage
- Human review queue service
- Approval and rejection API endpoints
- Mock execution path for approved `patient-outreach` write workflows

## API Surface

- `GET /v1/audit/events`
- `GET /v1/reviews`
- `GET /v1/reviews/:reviewId`
- `POST /v1/reviews/:reviewId/approve`
- `POST /v1/reviews/:reviewId/reject`

## Operational Model

- A write request enters `/v1/orchestrate`
- Policy routes it into `held_for_human_review`
- The API persists the orchestration audit event and a review request
- A reviewer approves or rejects the request
- Approval re-runs the workflow with the approval gate cleared
- Rejection preserves the request and emits a rejection audit event
