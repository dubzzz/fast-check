#!/bin/bash
# SessionStart hook: ensure dependencies are installed before Claude starts working.
# This is especially important in CI (GitHub Actions) where `pnpm install` may not
# have been run yet.

set -e

# Install pnpm via npm if not already available
if ! command -v pnpm &>/dev/null; then
  echo "pnpm not found, installing via npm..."
  npm install -g pnpm
fi

# Install/sync dependencies — always run to ensure node_modules matches the lockfile
# (e.g. after a dependency version bump, node_modules may exist but be stale)
echo "Installing dependencies with pnpm..."
pnpm -C "$CLAUDE_PROJECT_DIR" install --frozen-lockfile
