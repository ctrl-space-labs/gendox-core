#!/bin/bash
# Stop hook: verification harness that runs when Claude finishes responding
# Checks if modified files have obvious issues before the session ends
# Exit 0 = ok, Exit 2 = block (ask Claude to fix)

# Get list of modified files
MODIFIED_FILES=$(git diff --name-only 2>/dev/null)

if [ -z "$MODIFIED_FILES" ]; then
  exit 0
fi

ERRORS=""

# Check Java files for compilation issues (basic syntax)
JAVA_FILES=$(echo "$MODIFIED_FILES" | grep '\.java$' || true)
if [ -n "$JAVA_FILES" ]; then
  for f in $JAVA_FILES; do
    if [ -f "$f" ]; then
      # Check for unmatched braces
      OPEN=$(grep -o '{' "$f" | wc -l)
      CLOSE=$(grep -o '}' "$f" | wc -l)
      if [ "$OPEN" -ne "$CLOSE" ]; then
        ERRORS="$ERRORS\nUnmatched braces in $f (open: $OPEN, close: $CLOSE)"
      fi
    fi
  done
fi

# Check for accidentally committed secrets
for f in $MODIFIED_FILES; do
  if [ -f "$f" ]; then
    if grep -qiE "(api_key|secret_key|password)\s*=\s*['\"][^'\"]{8,}" "$f" 2>/dev/null; then
      # Exclude test/config files that legitimately reference these
      if ! echo "$f" | grep -qE "(test|spec|example|sample|application\.yml|docker-compose)"; then
        ERRORS="$ERRORS\nPossible hardcoded secret in $f"
      fi
    fi
  fi
done

# Check for debug/console statements left in code
for f in $MODIFIED_FILES; do
  if [ -f "$f" ]; then
    if echo "$f" | grep -qE '\.(js|ts|tsx|jsx)$'; then
      if grep -n 'console\.log\|debugger' "$f" 2>/dev/null | head -3 | grep -q .; then
        ERRORS="$ERRORS\nDebug statements found in $f"
      fi
    fi
    if echo "$f" | grep -qE '\.java$'; then
      if grep -n 'System\.out\.println\|\.printStackTrace()' "$f" 2>/dev/null | head -3 | grep -q .; then
        ERRORS="$ERRORS\nDebug statements found in $f"
      fi
    fi
  fi
done

if [ -n "$ERRORS" ]; then
  echo -e "Stop harness found issues:$ERRORS" >&2
  echo -e "\nPlease fix these before finishing." >&2
  exit 2
fi

exit 0
