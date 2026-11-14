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
| After a deploy: the same smoke suite on dev or prod, real models | `npm run smoke:dev` | minutes |
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
  tests build on each other. Locally a passing test deactivates its organization; a failing
  one keeps it and names it in `failures.md`. Seeded organizations and projects are for
  reading only. On a deployed target see "Deployed environments" below.
- `config/target.js`, `config/models.js`, `config/suite.js`: the target and model tier, the
  models per provider, and the configuration built from them. `config/ephemeral.config.js`
  and `config/deployed.config.js` only say where the environment is and who logs in.
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

## JSON API contracts

`tests/regression/json-contract.api.spec.js` (`@json-contract`) checks stable wire
behavior: field names, ISO dates, booleans/enums, ignored unknown fields, nested JSONB,
null update semantics, optional chat flags, and saved tool-call JSON across follow-ups.
It was baselined on Jackson 2 and rerun on Jackson 3. Keep it in the normal API suite:
it tests application behavior and persistence, without depending on a mapper version.
Run it with `npx playwright test json-contract.api.spec.js` after changes to JSON DTOs,
mapper configuration, entity JSON annotations or JSONB handling.

## Smoke tests

For v2, the eight browser smoke cases are in `tests/v2/smoke/browser.spec.js`. They cover
v2's wizard, automatic upload, document preview/Open, disabled reader settings and dock chat.
The Sources navigation regression is enabled with `@blocked` and a reason, outside smoke:
the known ephemeral metadata response is HTTP 500. Do not hide it with an expected-failure
assertion or backend change. `--project=ui --grep-invert @blocked` runs the runnable UI scope.
The v1 upload queue's remove-before-upload interaction is absent in v2; automatic uploading
replaces it. A separate v2 case checks unsupported-file rejection.

Tag with `{ tag: '@smoke' }`. A smoke test checks one path a user cannot work without, runs
alone (also when the other tests of its file are filtered out), takes a few seconds, and
works on every target, local and deployed (see "Deployed environments"). The
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

## LLM tests and model tiers

`tests/llm/agent.spec.js` (`@smoke @llm`) checks the contract with a model provider: the
embeddings, a tool call the model decides on, the stored tool history sent back on a
follow-up, and a Document Insights task run in the background. It runs once per provider,
in one Playwright project per provider (`llm-<provider>`), so providers run in parallel and
a failure names the adapter. `E2E_MODELS` picks the tier (`config/models.js`):

| Tier | Models | Checks |
|---|---|---|
| `mock` (default) | the mock models, free | structure only: the mock's fixed answer, tool rows, job |
| `small` | a cheap model of every provider | also the answer content |
| `large` | each provider's flagship | also the answer content |

Real models do not answer alike twice, so the tests never compare wording. The canary
document `fixtures/llm/halvorsen-archive.txt` holds an invented code no model can know; the
agent's instructions (`support/llm.js`) say it is under test and must follow the message
exactly; the assertions check the code in the answer, the `advanced_search` call and its
results in the stored messages, and that the model followed "in lower case". On real
models the agent searches in `AUTO` mode, so the model itself decides to call the tool; on
the mock, in `ALWAYS`. Real-model projects get 240 seconds per test and one retry.

Every other test uses the mock models on every target. `E2E_PROVIDERS=openai,anthropic`
limits the providers. `E2E_MAX_LLM_REQUESTS` caps the chat messages and task runs a run
may send (defaults: small 120, large 40); the run prints how many it sent.

Models above the free tier need a subscription, which belongs to an organization. With
real models the LLM tests therefore make their project in one subscribed organization
(on deployed targets `E2E_LLM_ORGANIZATION_ID`, see below), administered by test user 1,
and remove that project afterwards, also after a failure. Locally it defaults to seeded organization 1 (Pro plan),
and the provider keys come from the ephemeral `.env`. A job whose model calls fail still
completes, without an answer: the Insights test reports that as "stored no answer".

Real models on the local stack:

1. Put the providers' keys in `../gendox-compose-scripts/ephemeral/.env` (`OPENAI_KEY`,
   `ANTHROPIC_KEY`, `VOYAGE_KEY`, …) and apply them: `docker compose up -d --wait` there.
2. `E2E_MODELS=small npm run smoke`, or `E2E_MODELS=small E2E_PROVIDERS=openai,anthropic npm run smoke`
   for some providers only. The run's limit becomes 15 minutes. A provider without a key
   fails with its 401.

## Deployed environments

The smoke suite also runs against a deployed environment, after a deploy:

```bash
npm run smoke:dev                     # dev, small models (E2E_MODELS overrides)
E2E_CONFIRM_PROD=yes npm run smoke:prod
E2E_CONFIRM_PROD=yes E2E_MODELS=large E2E_PROVIDERS=openai npm run smoke:prod
```

Where the environment is comes from `.env.dev` / `.env.prod` (ignored by git) or from the
environment: `deployed.env.example` lists the names. Without a client that allows the
password grant, `E2E_TOKEN_SOURCE=browser` takes the API tokens from the browser logins of
the setup project (refresh-token grant on the frontend's client). In CI the gendox-devops
workflow "Run smoke tests on DEV or PROD" sets all of it.

Made once by hand per environment, so the tests hold no admin power (no Keycloak admin
client, no super-admin account):

- **Five test accounts** in the realm (`config/accounts.js`): `E2E_ACCOUNT_EMAIL` with
  `{name}` = user1..user4 / outsider (default `e2e-smoke-{name}@example.com`), enabled,
  email verified, no required actions, all with the password `E2E_ACCOUNT_PASSWORD` (a
  secret in CI). `E2E_USER1_EMAIL` / `_PASSWORD` and the like name one differently.
- **For real models, one organization** on a paid plan that includes them, with test user
  1 as administrator: `E2E_LLM_ORGANIZATION_ID`.

The global setup checks both before any test (`support/preflight.js`) and stops with what
to fix: an account that cannot log in, an organization test user 1 cannot open, or one
without an active paid plan. It warns two weeks before that plan ends.

Locally nothing is made by hand either way: the seeded users are the accounts, and seeded
organization 1 (Pro plan) is the organization for real models. The tests and their code
paths are the same; only where the accounts and the organization come from differs.

What changes on a deployed target (`config/target.js`):

- **Smoke only.** The configuration filters to `@smoke`, also for `npm test`: the rest of
  the suite relies on seeded data. A smoke test must work on any target: no seeded ids,
  no seeded organizations, its users' ids from their profiles (`userIdOf`).
- **Cleanup through the application's delete APIs** (`support/cleanup.js`), also after a
  failure (`E2E_KEEP_FAILED=1` keeps failed ones): per project its tasks, chat threads and
  documents, then the organization's API keys, then the organization is deactivated.
  Deleted for real: tasks with their nodes and answers; documents with their sections,
  embeddings and message links. Left behind, because no API deletes them: the
  deactivated organization and project rows (renamed DEACTIVATED, no members), the
  deactivated chat threads with their messages, search-query embeddings, revoked API keys,
  audit logs, usage records and the uploaded files in storage: a few hundred small rows
  and a few kilobytes per run. The run prints `CLEANUP INCOMPLETE` for any step that
  failed. `E2E_PURGE=1` runs the same cleanup locally.
- **Write guard** (`support/guard.js`): every request that changes something must name an
  organization or project this worker created, or it is refused before it is sent, for
  the `api` context and for the browser in tests using `page` from `support/workspace`.
  `E2E_WRITE_GUARD=1` turns it on locally. A smoke test that writes through a route
  without such an id needs the guard taught about it, never switched off.
- **Fewer at once, more time:** 4 workers (2 for the browser), 120 seconds per test,
  15 minutes for the run (`E2E_GLOBAL_TIMEOUT` in seconds), no warm-up organization,
  no stale-build check, no local API log.
- **Production asks first:** `E2E_TARGET=prod` stops unless `E2E_CONFIRM_PROD=yes`.
- **History** goes to `test-history/dev/` and `test-history/prod/`.

To try a deployed run without one, point `.env.dev` at the local stack's URLs and seeded
users (client `gendox-dev-test-client`) and run `E2E_MODELS=mock npm run smoke:dev`.

## Things that bite

- **Keycloak login forms.** `support/login.js` supports username and password together,
  or username, Next, then password. Start the profile-response wait only before the
  final submit so an earlier form failure is reported at the action that failed.
- **V2 fields and conversation scope.** Some visual labels are not associated with their
  controls. `support/v2/app.js` scopes by the visible label's parent. Mock answer text can
  also be a recent-conversation link in the sidebar; assert answers inside `main`.
  Reopen persisted dock conversations through their real sidebar links before interacting.
- **V2 training fixture.** The API-only workspace leaves `autoTraining` unset, whereas the
  v2 create-agent wizard enables it. The Process now scenario explicitly enables it before
  uploading, so the training job's enabled-project criterion includes this fixture.
- **V2 profile/logout isolation.** Give profile and real-login/logout cases their own workspace and use an
  explicit organization/project URL for the profile. An unscoped profile can select a
  parallel case's organization while that case is still creating its first project.
- **V2 selectors.** No `data-testid` attributes were added. Preserve role/label locators;
  if a new one is necessary, document exactly which element and why.
- **V2 upload completion.** A successful upload response can arrive before the dialog
  marks the file Uploaded. Wait for that visible state, then close and assert the dialog
  is gone before interacting with the knowledge list behind it.
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
volume, test history, or data in the database. The things the suite removes by itself
are what a test made in its own organization or project (deactivated locally, deleted
and deactivated on a deployed target) and run folders beyond the last 30 failed runs.
