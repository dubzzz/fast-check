#!/bin/bash
# PostToolUse hook: auto-format the edited file with the project's format:file script
INPUT=$(cat /dev/stdin)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
  pnpm format:file -- "$FILE_PATH" 2>/dev/null
fi

exit 0  # Never block edits for formatting -- just fix silently
