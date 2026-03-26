#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$REPO_ROOT/tools/codex-skills"
DEST="${CODEX_HOME:-$HOME/.codex}/skills"

mkdir -p "$DEST"
cp -R "$SRC"/. "$DEST"/

echo "Installed repo-managed Codex skills from $SRC to $DEST"
