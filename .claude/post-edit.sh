#!/bin/bash
set -e

INPUT=$(cat /dev/stdin)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only run on source files
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx && "$FILE_PATH" != *.js && "$FILE_PATH" != *.jsx ]]; then
  exit 0
fi

# Format only the impacted file (not the whole project)
pnpm exec prettier --experimental-cli --write "$FILE_PATH" 2>&1 || true

# Build
pnpm build:all 2>&1

# Typecheck
pnpm typecheck:all 2>&1

# Run related tests (non-watch, single run)
pnpm test run --reporter=verbose "$FILE_PATH" 2>&1 || true
