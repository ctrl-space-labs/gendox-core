Create a pull request that addresses a GitHub issue.

Issue: $ARGUMENTS

Steps:
1. Fetch the issue details: `gh issue view <number>`
2. Read all comments for additional context: `gh issue view <number> --comments`
3. Analyze what changes are needed (backend, frontend, database, tests)
4. Create a branch: `git checkout -b feat/<short-description>` from main
5. Implement the changes following existing Gendox patterns
6. Write Playwright e2e tests for any API changes
7. Build and verify:
   - `cd gendox-core-api && mvn clean install -DskipTests`
   - `cd gendox-frontend && yarn build`
8. Commit with a descriptive message
9. Push and create a PR:
   ```
   gh pr create --title "Short description" --body "Closes #<number>

   ## Summary
   - What was done

   ## Test plan
   - [ ] E2e tests added/updated
   - [ ] Build verified
   "
   ```

Important:
- Always reference the issue with "Closes #N" so it auto-closes on merge
- Include e2e tests for API changes
- Follow existing code patterns and conventions
