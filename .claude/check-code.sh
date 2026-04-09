#!/bin/bash
# Stop hook: build, lint, and typecheck after Claude finishes

ERRORS=""

echo "Running build..."
if ! pnpm build:all 2>&1; then
  ERRORS+="Build failed. "
fi

echo "Running lint check..."
if ! pnpm lint:check 2>&1; then
  ERRORS+="Lint failed. "
fi

echo "Running typecheck..."
if ! pnpm typecheck:all 2>&1; then
  ERRORS+="Typecheck failed. "
fi

if [ -n "$ERRORS" ]; then
  echo "Checks failed: $ERRORS" >&2
  echo "Please fix the errors above before finishing." >&2
  exit 2  # Unblocks Claude to fix
fi

echo "All checks passed."
exit 0
