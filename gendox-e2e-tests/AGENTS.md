# End-to-end tests: guide for coding agents

This file is maintained by the coding agents that work on the suite. When you learn how
something here really works, change this file. Short-lived findings go to `NOTES.md`.

**This tooling is available to you, not required.** It is the fast, repeatable way to check
that a change did not break the application. If opening the application in a browser, or
calling the API directly, suits the task better, do that.

## Commands

Run from `gendox-e2e-tests`, against this checkout's environment (see
`../gendox-compose-scripts/ephemeral/README.md`; it must be up).

| When | Command | Time |
|---|---|---|
| Between turns: did I break something basic? | `npm run smoke` | about 20 s |
| While working on a feature: its own tests | `npx playwright test documents` or `-g "upload"` | seconds |
| Re-run what just failed | `npx playwright test --last-failed` | seconds |
| End of the work: no regression | `npm test` | about 20 s |
| What tests exist | `npm run list`, or `npx playwright test --list --grep @smoke` | |
| The last run in a browser | `npm run report` | |

First use in a checkout: `npm install`, then `npx playwright install chromium`.

The tests run the code that is built, not the code that is edited. After a backend or
frontend change, rebuild as the ephemeral README says. The run prints a `[stale build]`
warning when it sees sources newer than the build.

## Reading results

A run ends with a few `[e2e]` lines: the counts, each failed test with its first error line,
and where the details are. Everything is in `test-history/` (not in git, one per checkout):

- `STATUS.md`: every test with its tags, last result, last run, last pass, and the recent runs.
- `runs.jsonl`: one line per run, with branch, commit and command.
- `<run>/failures.md`: for a run with failures, each failed test's error and last steps, the
  paths of its trace, screenshot and page snapshot (`error-context.md`), and `api.log`, the
  API's output during the run. Read `error-context.md` first: it shows the page as the test
  saw it.

Only the last 30 failed runs keep their folder.

## How the suite is built

- `playwright.config.js` takes its settings from `config/ephemeral.config.js`, which reads the
  environment's ports from `../gendox-compose-scripts/ephemeral/.env`. Projects: `setup` logs
  each seeded user in and saves the session in `.auth/`, `api` is `tests/api-tests`, `ui` is
  `tests/ui` and starts from the saved sessions.
- `support/workspace.js`: isolation. A test that changes data works in an organization of
  its own. Use the `workspace` fixture for one test, or `sharedWorkspace()` for a file whose
  tests build on each other. A passing test deactivates its organization; a failing one keeps
  it and names it in `failures.md`. Seeded organizations and projects are for reading only.
- `support/app.js` and `support/login.js`: helpers for browser tests.
- `support/history-reporter.js`: writes `test-history/`.
- `support/global-setup.js`: checks the environment answers and warns about stale builds.
- `page-objects/apis/`: one module per API area. `seed.js` lists the seeded ids and roles.

## Writing a test

- Import `test` and `expect` from `support/workspace`, not from `@playwright/test`.
- Tests run in parallel, in any order, next to data from earlier runs. Never rely on counts
  or names in shared data; create what you need in the workspace.
- New projects come with the mock models, so nothing needs a provider key.
- Browser tests: `test.use({ storageState: sessionOf('testUser1') })`, open screens by URL
  with `inProject(workspace, 'home')`, and locate by role and visible label. The frontend has
  no test ids; add a `data-testid` only where role and label are ambiguous.
- Access denied is answered as 404 by design. A test for it needs a passing counterpart on
  the same route, because a wrong route returns 404 too.
- Assert on API responses with `expectOk(response)`, which shows what the API answered.

## Smoke tests

Tag with `{ tag: '@smoke' }`. A smoke test checks one path a user cannot work without, runs
alone (also when the other tests of its file are filtered out), and takes a few seconds. The
whole smoke run should stay under a minute. Everything else belongs in the full suite.

## Things that bite

- **Stale profile.** The API caches each user's organizations and projects. The seeded
  users act in many tests at once, and right after a change a user can still get the old
  state. After creating an organization or project, or adding a member, call
  `ensureAccess()` before using it. The fixture already does.
- **First organization after an API start.** Creating several organizations at once right
  after the API starts breaks its DID key setup until it restarts. The global setup creates
  one alone first. If creating an organization fails with a DID resolver error, run
  `docker compose restart api`.
- **Settings tabs.** Clicking a tab of project settings before the project has loaded
  crashes the page. Call `projectSettingsLoaded(page)` first.
- **Uploads** use a hidden file input: `page.locator('input[type=file]').setInputFiles(...)`,
  then the "Upload Files" button.
- **Training** (splitting and embedding uploaded documents) is a background job. Tests that
  need sections ask for the split through the API (`documents.splitDocumentSections`).

## Deleting

Always ask the user before deleting anything: an environment (`docker compose down`), a
volume, test history, or data in the database. The two things the suite removes by itself
are the organization of a passing test and run folders beyond the last 30 failed runs.
