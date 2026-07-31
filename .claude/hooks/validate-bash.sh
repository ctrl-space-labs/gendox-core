#!/bin/bash
# PreToolUse hook: validate Bash commands before execution
# Exit 0 = allow, Exit 2 = block

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block destructive database operations
if echo "$COMMAND" | grep -iqE "drop\s+(table|database|schema)|truncate\s+table"; then
  echo "Blocked: destructive database operation. Use a Flyway migration instead." >&2
  exit 2
fi

# Block force pushes
if echo "$COMMAND" | grep -qE "git\s+push\s+.*--force|git\s+push\s+-f"; then
  echo "Blocked: force push is not allowed. Use a regular push." >&2
  exit 2
fi

# Block hard resets
if echo "$COMMAND" | grep -qE "git\s+reset\s+--hard"; then
  echo "Blocked: git reset --hard can destroy work. Use git stash or a soft reset." >&2
  exit 2
fi

# Block recursive deletes on important dirs
if echo "$COMMAND" | grep -qE "rm\s+-rf\s+(/|~|\.\.|gendox-core-api|gendox-frontend|database)"; then
  echo "Blocked: recursive delete on protected directory." >&2
  exit 2
fi

# Block credential file access
if echo "$COMMAND" | grep -qE "cat\s+.*\.(env|pem|key)|echo.*ANTHROPIC_API_KEY|echo.*SECRET"; then
  echo "Blocked: do not read or echo secrets/credentials." >&2
  exit 2
fi

exit 0
