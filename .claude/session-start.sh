#!/bin/bash
# SessionStart hook: ensure dependencies are installed before Claude starts working.
# This is especially important in CI (GitHub Actions) where `pnpm install` may not
# have been run yet.

set -e

# Detect pnpm — corepack should make it available via packageManager field,
# but enable it explicitly if needed.
if ! command -v pnpm &>/dev/null; then
  corepack enable 2>/dev/null || true
fi

# Install dependencies if node_modules is missing or empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "Installing dependencies with pnpm..."
  pnpm install --frozen-lockfile
fi
