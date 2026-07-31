Implement a GitHub issue and create a PR with the solution.

The issue to implement: $ARGUMENTS

Follow these steps:

1. **Read the issue** — use `gh issue view <number>` to get the full description, labels, and comments
2. **Analyze the requirements** — break down what needs to be done
3. **Create a feature branch** — `git checkout -b feat/<short-description>` from main
4. **Implement the solution** following Gendox patterns:
   - Backend: Controller → Service → Repository layered architecture
   - Frontend: Next.js pages + shadcn/ui components + Redux state
   - Database: Flyway migrations for schema changes
5. **Write Playwright e2e tests** for any new API endpoints:
   - Create page objects in `gendox-e2e-tests/page-objects/apis/`
   - Create test specs in `gendox-e2e-tests/tests/api-tests/`
   - Follow the existing POM pattern (see other files for reference)
   - Include auth setup with `keycloak.simpleUserLogin(request)`
   - Test both success and error/unauthorized cases
6. **Verify the build** — run `cd gendox-core-api && mvn clean install -DskipTests` and `cd gendox-frontend && yarn build`
7. **Commit and push** the changes
8. **Create a PR** with `gh pr create` referencing the issue (use "Closes #N" in the body)

Always include e2e tests for new or modified API endpoints.
