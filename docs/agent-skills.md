# Repo-Managed Agent Skills

This repository stores the project-specific agent skills under `tools/agent-skills/`. That directory is the source of truth for repo-owned skills.

The bundle is intentionally named generically so it can be reused by any agent platform that can consume the same folder layout. The current local install script defaults to the Codex skills directory, but it can target any compatible agent skill directory.

## Current Repo-Managed Skills

- `phase-planner`
- `healthcare-architecture-reviewer`
- `release-checklist`

## Install

From the repo root:

```bash
bash scripts/install-agent-skills.sh
```

By default, this copies the repo-managed skills into:

```text
${CODEX_HOME:-$HOME/.codex}/skills
```

To install into another compatible agent directory:

```bash
AGENT_SKILLS_TARGET_DIR=/path/to/agent/skills bash scripts/install-agent-skills.sh
```

## Update Workflow

1. Edit the skill files under `tools/agent-skills/`
2. Reinstall them locally with `bash scripts/install-agent-skills.sh`
3. Validate the relevant skills
4. Commit the repo copy, not just the installed local copy

## Validation

Use the local skill validator:

```bash
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/agent-skills/phase-planner
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/agent-skills/healthcare-architecture-reviewer
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py tools/agent-skills/release-checklist
```

## Scope Boundary

Keep repo-specific skills here. Keep personal or unrelated global skills outside the repository-managed copy unless they are intentionally shared with future maintainers of this project.
