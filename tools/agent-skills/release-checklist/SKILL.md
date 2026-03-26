---
name: release-checklist
description: Run a release or pre-push maintenance checklist for an active repository, covering verification commands, docs alignment, env/config drift, smoke checks, git state, and release readiness. Use when preparing to push, release, or hand off changes.
---

# Release Checklist

Use this skill when a repo needs a repeatable, disciplined final pass before push, release, or handoff.

## Checklist Goal

Confirm the change is not only implemented, but shippable:
- required verification commands pass
- docs and examples match runtime behavior
- env vars and defaults are documented
- smoke checks cover the changed user-visible path
- git state is clean and commit intent is clear

## Workflow

1. Read the repo's documented workflow.
Find required commands, release expectations, and any planning or prompt-log obligations.

2. Run required checks.
At minimum, use the repo's standard commands. Do not assume; read the package scripts or workflow docs.

3. Check release-adjacent drift.
Look for:
- changed env vars without `.env.example` updates
- new routes or behaviors without README or runbook updates
- missing prompt-log or roadmap updates if the repo requires them
- stale phase status or release notes

4. Perform focused smoke checks.
Use the smallest set of live checks that proves the changed feature works end to end.

5. Confirm git readiness.
Check branch, status, staged scope, and whether the intended commit grouping makes sense.

## Output Format

Report:
- commands run and whether they passed
- live checks performed
- docs or config drift found
- release blockers, if any
- whether the repo is ready to push or release

## Rules

- Prefer deterministic checks over informal confidence.
- Do not say something is release-ready if required checks or docs are missing.
- If there are no blockers, say so directly.
