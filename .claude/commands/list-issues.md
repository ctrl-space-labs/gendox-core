List open GitHub issues that can be worked on.

Filter: $ARGUMENTS

Run the appropriate command based on the filter:

- If no filter: `gh issue list --state open --limit 20`
- If a label is given: `gh issue list --state open --label "$ARGUMENTS" --limit 20`
- If "mine" or "assigned": `gh issue list --state open --assignee @me --limit 20`
- If "claude": `gh issue list --state open --label "claude" --limit 20`

For each issue, show: number, title, labels, and assignee.

Suggest which issues are good candidates for automated implementation (clear requirements, well-scoped, has acceptance criteria).
