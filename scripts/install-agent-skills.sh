#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/tools/agent-skills"
DEST="${AGENT_SKILLS_TARGET_DIR:-${CODEX_HOME:-$HOME/.codex}/skills}"

mkdir -p "$DEST"
cp -R "$SRC"/. "$DEST"/

echo "Installed repo-managed agent skills from $SRC to $DEST"
