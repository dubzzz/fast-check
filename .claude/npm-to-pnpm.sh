#!/bin/bash
INPUT=$(cat /dev/stdin)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // empty')

NEW_CMD=$(printf '%s' "$CMD" | sed 's/\bnpx\b/pnpm dlx/g; s/\bnpm\b/pnpm/g; s/\byarn\b/pnpm/g')

if [ "$NEW_CMD" != "$CMD" ]; then
  printf '%s' "$INPUT" | jq -c --arg cmd "$NEW_CMD" '{decision: "modify", tool_input: (.tool_input | .command = $cmd), reason: ("This project uses pnpm. Replaced command: " + $cmd)}'
else
  echo '{"decision":"approve"}'
fi
