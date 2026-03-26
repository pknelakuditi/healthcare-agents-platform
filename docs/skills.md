# Repo-Managed Codex Skills

This repository stores the project-specific Codex skills under `tools/codex-skills/`. That directory is the source of truth for repo-owned skills. The local Codex skills directory is treated as an install target, not the canonical copy.

## Current Repo-Managed Skills

- `phase-planner`
- `healthcare-architecture-reviewer`
- `release-checklist`

## Install

From the repo root:

```bash
bash scripts/install-codex-skills.sh
```

This copies the repo-managed skills into:

```text
${CODEX_HOME:-$HOME/.codex}/skills
```

## Update Workflow

1. Edit the skill files under `tools/codex-skills/`
2. Reinstall them locally with `bash scripts/install-codex-skills.sh`
3. Validate the relevant skills
4. Commit the repo copy, not just the installed local copy

## Validation

Use the local skill validator:

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/codex-skills/phase-planner
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/codex-skills/healthcare-architecture-reviewer
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/codex-skills/release-checklist
```

## Scope Boundary

Keep repo-specific skills here. Keep personal or unrelated global skills outside the repository-managed copy unless they are intentionally shared with future maintainers of this project.
