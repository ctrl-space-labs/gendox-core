#!/bin/bash
# PreToolUse hook: validate file edits before execution
# Exit 0 = allow, Exit 2 = block

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Block editing environment/secret files
if echo "$FILE_PATH" | grep -qE "\.(env|pem|key)$|credentials\.json|secrets\."; then
  echo "Blocked: cannot edit secret/credential files." >&2
  exit 2
fi

# Block editing lock files directly
if echo "$FILE_PATH" | grep -qE "(package-lock\.json|yarn\.lock|pom\.xml\.lock)$"; then
  echo "Blocked: lock files should not be edited directly. Use the package manager." >&2
  exit 2
fi

# Block editing Flyway migration files that are already applied (V prefix, not the latest)
if echo "$FILE_PATH" | grep -qE "db/migrations/.*\.sql$"; then
  BASENAME=$(basename "$FILE_PATH")
  # Allow new migrations (created in this session), warn about existing ones
  if [ -f "$FILE_PATH" ]; then
    echo "Warning: editing an existing migration file. Only edit if it has not been applied to any environment." >&2
  fi
fi

exit 0
