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
| Between turns: did I break something basic? | `npm run smoke` | about 30 s; 60 s cap |
| While working on a feature: its own tests | `npx playwright test documents` or `-g "upload"` | seconds |
| Re-run what just failed | `npx playwright test --last-failed` | seconds |
| End of the work: no regression | `npm test` | measure on your stack |
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

- `config/frontend.js` defaults to v2 when `gendox-frontend-v2/` exists, otherwise v1.
  `E2E_FRONTEND=v1|v2`, `test:v1`, `test:v2`, `smoke:v1` and `smoke:v2` select explicitly.
  This selects tests, not the running frontend: an explicit v1 run needs a served v1
  build, with `E2E_FRONTEND_URL` set when necessary. Prefix commands with
  `ENV_NAME=EPHEMERAL` to override a local `.env` choosing an older configuration.
  The `ui` project uses `tests/v2/{ui,smoke,regression}/` for v2. V1 specs stay in their
  original locations, untouched, and only match absolute paths under those locations
  so the v1 `ui/**` glob cannot accidentally include `v2/ui/**`.
- `playwright.config.js` takes its settings from `config/ephemeral.config.js`, which reads the
  environment's ports from `../gendox-compose-scripts/ephemeral/.env`. Projects: `setup` logs
  each seeded user in and saves the session in `.auth/<invocation>/`; `api` includes
  `tests/api-tests` and `tests/smoke/api.spec.js`; `ui` includes `tests/ui` and
  `tests/smoke/ui.spec.js` and starts from the saved sessions. The API and UI projects also
  include `tests/regression/*.api.spec.js` and `*.ui.spec.js`, respectively.
- `streaming-contract` runs the embedded frontend against `fixtures/chat-streaming-server.cjs`
  in the full suite, with one worker because that legacy fixture has shared state. It is
  excluded from smoke. It exercises the client protocol, not real backend persistence.
  On v2 it instead uses `fixtures/v2/chat-streaming-server.cjs` and `tests/v2/streaming`,
  serving `gendox-frontend-v2/out` with explicit runtime API configuration. Its port derives
  from the checkout's frontend port, with `E2E_STREAMING_PORT` as an override. V1 retains
  the original fixture. Both are single-worker projects because their mock API state is shared.
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

For v2, the eight browser smoke cases are in `tests/v2/smoke/browser.spec.js`. They cover
v2's wizard, automatic upload, document preview/Open, disabled reader settings and dock chat.
The Sources navigation regression is enabled with `@blocked` and a reason, outside smoke:
the known ephemeral metadata response is HTTP 500. Do not hide it with an expected-failure
assertion or backend change. `--project=ui --grep-invert @blocked` runs the runnable UI scope.
The v1 upload queue's remove-before-upload interaction is absent in v2; automatic uploading
replaces it. A separate v2 case checks unsupported-file rejection.

Tag with `{ tag: '@smoke' }`. A smoke test checks one path a user cannot work without, runs
alone (also when the other tests of its file are filtered out), and takes a few seconds. The
smoke command enforces a 60-second global timeout (including global setup and real logins),
with no retries. Builds and stack boot happen beforehand. It must contain no skips.

`tests/smoke/api.spec.js` holds independent API checks; `tests/smoke/ui.spec.js` holds focused
browser checks. Three existing browser journeys and the Sources case in
`tests/regression/chat.ui.spec.js` also carry the smoke tag. Do not add smoke
tags to serial CRUD chains or cases using `sharedWorkspace`. Put all prerequisites in the
case or its test-scoped fixture, and verify the case alone as well as in a parallel run.

`npm run smoke -- --shard=1/2` supports distribution; repeat with `--shard=2/2` in a separate
CI checkout. Keep project dependencies enabled: every shard logs its users in. Sessions are
invocation-specific, but reports/history still share destinations inside one checkout.
`E2E_WORKERS` or `--workers` changes worker count without serializing tests or altering coverage.
Project creation in the browser uses testUser3 as its owner: other smoke cases do not change
that identity's organization/project memberships while it refreshes its profile.

The current [v2 coverage plan](../.ai/e2e-v2-coverage-2026-11-11.md), alongside the unchanged
[original v1 plan](../.ai/e2e-coverage-2026-11-11.md), lists remaining application
journeys and their prerequisites. The older unfinished journeys now have executable
full-suite tests for logout, workspace creation, insights generation and training.
Use `--grep @p1`, `--grep @p2`, or `--grep-invert @background` to select regression work.
`E2E_UI_WORKERS` defaults to four to keep local Chromium rendering responsive. The API
workers and each isolated browser case remain parallelizable.

## Things that bite

- **V2 fields and conversation scope.** Some visual labels are not associated with their
  controls. `support/v2/app.js` scopes by the visible label's parent. Mock answer text can
  also be a recent-conversation link in the sidebar; assert answers inside `main`.
  Reopen persisted dock conversations through their real sidebar links before interacting.
- **V2 training fixture.** The API-only workspace leaves `autoTraining` unset, whereas the
  v2 create-agent wizard enables it. The Process now scenario explicitly enables it before
  uploading, so the training job's enabled-project criterion includes this fixture.
- **V2 logout isolation.** Give the real-login/logout case its own workspace and use an
  explicit organization/project URL for the profile. An unscoped profile can select a
  parallel case's organization while that case is still creating its first project.
- **V2 selectors.** No `data-testid` attributes were added. Preserve role/label locators;
  if a new one is necessary, document exactly which element and why.
- **Stale profile.** The API caches each user's organizations and projects. The seeded
  users act in many tests at once, and right after a change a user can still get the old
  state. After creating an organization or project, or adding a member, call
  `ensureAccess()` before using it. The fixture already does. Its `setupRequest` helper
  also refreshes the owner's cached membership after a refused fixture-construction
  request. Never use that helper around access-denial assertions or application actions
  under test. API contexts allow 30 seconds per request for cold document parsers;
  browser actions have a separate 10-second limit and smoke retains its whole-run cap.
- **First organization after an API start.** Creating several organizations at once right
  after the API starts breaks its DID key setup until it restarts. The global setup creates
  one alone first. If creating an organization fails with a DID resolver error, run
  `docker compose restart api`.
- **Organization settings saves** reload the document themselves. Start waiting for the main-frame
  navigation before clicking Save; do not race it with a second `page.reload()`.
- **Settings tabs.** Clicking a tab of project settings before the project has loaded
  crashes the page. Call `projectSettingsLoaded(page)` first.
- **Uploads** use a hidden file input: `page.locator('input[type=file]').setInputFiles(...)`,
  then the "Upload Files" button.
- **Mock models** now honor a required `advanced_search` call, return structured answers for
  Document Insights and use stable mock vectors. They exercise real tools/jobs without LLM
  costs; they do not assess relevance or answer quality.
- **Training** (splitting and embedding uploaded documents) is a background job. Tests that
  need sections ask for the split through the API (`documents.splitDocumentSections`).

## Deleting

Always ask the user before deleting anything: an environment (`docker compose down`), a
volume, test history, or data in the database. The two things the suite removes by itself
are the organization of a passing test and run folders beyond the last 30 failed runs.
