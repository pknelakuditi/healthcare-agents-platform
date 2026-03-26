# Phase 10B Repo-Managed Codex Skills

## Objective

Persist the repo-specific Codex maintenance skills inside the repository so they can be versioned, reviewed, reinstalled locally, and shared with future contributors.

## Scope

- copy repo-owned Codex skills into the repository
- add an installer script that syncs repo-managed skills into the local Codex skills directory
- document how to install, update, and validate the repo-managed skills

## Out Of Scope

- publishing skills externally
- managing all personal or global skills through this repo
- building a marketplace or auto-update system

## Deliverables

- repo-owned copies of the current maintenance skills
- install script for local Codex skill sync
- documentation for the repo-managed skill workflow

## Verification Plan

- `bash scripts/install-codex-skills.sh`
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/codex-skills/phase-planner`
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/codex-skills/healthcare-architecture-reviewer`
- `python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/codex-skills/release-checklist`
- manual verification:
  - confirm the repo-managed skill files exist under `tools/codex-skills/`
  - confirm the installer copies them into the local Codex skills directory

## Commit Target

- `Phase 10B repo-managed Codex skills`

## Follow-Up Items

- add repo-managed skill update guidance for future contributors
- decide whether additional healthcare-platform-specific skills belong in the repo copy
- add validation automation for repo-managed skills if the set grows
