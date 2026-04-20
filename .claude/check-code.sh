#!/bin/bash
# Stop hook: build, lint, and typecheck after Claude finishes
ERRORS=""

if ! command -v pnpm &>/dev/null; then
  echo "pnpm not found, installing via npm..."
  if ! npm install -g pnpm 2>&1; then
    ERRORS+="pnpm install via npm failed. "
  fi
fi

echo "Installing dependencies with pnpm..."
if ! pnpm -C "$CLAUDE_PROJECT_DIR" install --frozen-lockfile 2>&1; then
  ERRORS+="Dependency install failed. "
fi

echo "Running build..."
if ! pnpm -C "$CLAUDE_PROJECT_DIR" build:all 2>&1; then
  ERRORS+="Build failed. "
fi

echo "Running lint check..."
if ! pnpm -C "$CLAUDE_PROJECT_DIR" lint:check 2>&1; then
  ERRORS+="Lint failed. "
fi

echo "Running typecheck..."
if ! pnpm -C "$CLAUDE_PROJECT_DIR" typecheck:all 2>&1; then
  ERRORS+="Typecheck failed. "
fi

if [ -n "$ERRORS" ]; then
  echo "Checks failed: $ERRORS" >&2
  echo "Please fix the errors above before finishing." >&2
  exit 2  # Unblocks Claude to fix
fi

echo "All checks passed."
exit 0
