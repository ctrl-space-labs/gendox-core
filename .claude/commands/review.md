Review the current changes for code quality, consistency, and potential issues.

Run `git diff` to see all current changes, then analyze them for:

1. **Code quality**: naming conventions, error handling, edge cases
2. **Security**: SQL injection, XSS, command injection, exposed secrets, OWASP top 10
3. **Consistency**: follows existing patterns, uses established conventions
4. **Architecture**: proper layering, separation of concerns, no circular dependencies
5. **Performance**: N+1 queries, unnecessary computations, missing indexes
6. **Testing**: suggest tests that should be written for the changes

Provide actionable feedback organized by severity (critical, warning, suggestion).
