# Phase 10C Agent-Agnostic Skill Packaging

## Objective

Refactor the repo-managed skill packaging so the repository does not present the skill bundle as Codex-only, while preserving a smooth Codex install path for current local use.

## Scope

- rename repo-managed skill folders and installer script to agent-agnostic terms
- update documentation to describe generic skill-bundle usage
- keep the existing Codex install flow available as the default local target

## Out Of Scope

- changing the actual skill contents or maintenance workflows
- supporting every agent platform with custom install adapters
- converting the skills to a different schema

## Deliverables

- agent-agnostic skill folder naming in the repo
- agent-agnostic installer script with configurable target directory
- updated docs explaining generic and Codex-specific usage

## Verification Plan

- `bash scripts/install-agent-skills.sh`
- `AGENT_SKILLS_TARGET_DIR=/tmp/healthcare-agent-skills-test bash scripts/install-agent-skills.sh`
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/agent-skills/phase-planner`
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/agent-skills/healthcare-architecture-reviewer`
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/agent-skills/release-checklist`

## Commit Target

- `Phase 10C agent-agnostic skill packaging`

## Follow-Up Items

- add adapters or export guidance if another agent platform with a different schema is adopted
- decide whether the repo should keep a Codex-specific compatibility alias script
