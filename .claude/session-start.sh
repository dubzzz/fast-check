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

# Install dependencies if node_modules is missing or empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "Installing dependencies with pnpm..."
  pnpm install --frozen-lockfile
fi
