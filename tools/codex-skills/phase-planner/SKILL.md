---
name: phase-planner
description: Plan and maintain phased development work for a repository with durable roadmap, phase docs, prompt logging, verification gates, and commit hygiene. Use when the user wants to continue a project phase-by-phase, persist the next phases, or keep repo planning docs in sync with implementation.
---

# Phase Planner

Use this skill when work is organized into explicit phases and the repo, not chat history, must remain the source of truth.

## Primary Goal

Keep implementation and planning synchronized:
- roadmap reflects completed, current, and queued phases
- each implementation phase has a phase doc
- prompt-log captures the prompts or working interpretation that drove the phase
- commits group planning updates with the code for that phase

## Workflow

1. Establish the repo planning baseline.
Read the roadmap, prompt log, and the most recent phase doc before changing anything.

2. Decide whether the request is planning-only or implementation.
- Planning-only: update roadmap, add queued phase docs, update prompt log, commit planning changes only.
- Implementation: update roadmap, create or update the phase doc, update prompt log, implement, verify, then commit all of it together.

3. Keep phase docs concrete.
Each phase doc should include:
- objective
- scope
- out of scope
- deliverables
- verification plan
- commit target
- follow-up items

4. Treat verification as part of the phase.
If implementation happened, run the repo's required checks and record any live smoke checks that matter to the changed behavior.

5. Keep the roadmap honest.
Do not leave a completed phase marked in progress. Completed phases should reference the commit hash once the phase is committed.

## Rules

- Do not start implementation when the user asked only to persist or refine the plan.
- Do not keep future work only in chat.
- Prefer 2-4 queued phases with concrete outcomes over a long vague backlog.
- If the repo already has a planning workflow, follow it instead of inventing a parallel one.
- When in doubt, update roadmap, phase doc, and prompt log first.

## Output Expectations

Summarize:
- what planning files were updated
- whether implementation happened or not
- whether a commit was created
- what the next queued phase is
