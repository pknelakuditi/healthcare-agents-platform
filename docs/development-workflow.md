# Development Workflow

Follow this workflow for every new phase by default.

## Required Planning Updates

Before or during implementation:

1. Update [roadmap.md](/Users/pavannelakuditi/personal-projects/healthcare-agents-platform/docs/roadmap.md)
2. Create or update the relevant file in `docs/phases/`
3. Add the user prompts and working interpretation to [prompt-log.md](/Users/pavannelakuditi/personal-projects/healthcare-agents-platform/prompt-log.md)

Do not treat chat history as the source of truth for planning. The repo must contain the current plan.

## Required Phase File Structure

Each phase file should contain:

- objective
- scope
- out of scope
- deliverables
- verification plan
- commit target
- follow-up items

## Required Verification

Every phase must run:

```bash
npm run typecheck
npm test
npm run build
```

If a feature changes runtime behavior, also perform at least one live smoke check and document the endpoint or command used.

## Required Commit Hygiene

- Commit after each completed phase
- Keep prompt log updates in the same commit as the code changes
- Keep roadmap and phase file updates in the same commit as the implemented phase

## Repo-Local Agent Permissions

For this repository, routine git staging and commit creation are pre-approved as part of normal task completion:

- `git add ...`
- `git commit -m "..."`

Use this standing approval only for commits that directly reflect the active task in this repo. Continue to surface or ask before riskier git operations such as:

- rebases
- resets
- amends not explicitly requested
- force pushes
- destructive checkout or restore operations

## Review Standard

- Prefer production-safe defaults
- Keep write paths gated
- Add tests for new behavior
- Document operational assumptions and remaining gaps
