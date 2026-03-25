# Phase 13 Deployment Manifests And Ops Readiness

## Objective

Package the platform for repeatable deployment and document the operational paths needed to run it safely in an environment beyond local development.

## Scope

- deployment manifests for API, worker, and eval-runner
- environment overlays or templates for core runtime settings
- operational runbooks for deployment, rollback, and secret rotation
- readiness and diagnostics alignment with deployment expectations

## Out Of Scope

- production cloud account setup
- full infrastructure-as-code for every environment
- autoscaling and cost optimization

## Deliverables

- initial deployment manifests and configuration templates
- operational runbooks for deploy, rollback, and secret rotation
- readiness and startup guidance aligned with deployment requirements
- tests or validation steps for manifest and config integrity where practical

## Verification Plan

- `npm run typecheck`
- `npm test`
- `npm run build`
- manual verification:
  - validate the deployment manifests render or apply cleanly in the target format
  - verify the documented rollout and rollback steps are executable
  - verify readiness checks match the operational runbook expectations

## Commit Target

- `Phase 13 deployment manifests and ops readiness`

## Follow-Up Items

- add environment-specific deployment overlays
- integrate secret management and rotation with the final deployment target
- add production alerting and dashboard references to the runbooks
