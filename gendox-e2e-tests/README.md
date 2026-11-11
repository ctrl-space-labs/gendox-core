# Gendox End-2-End Tests

This directory contains the end-2-end tests for Gendox. These tests are written in Playwright JS. 
The tests **must** run before each PR to `dev` or `main` branches.




## Run the tests

The tests run against this checkout's ephemeral environment. Start it first, as described in
[its README](../gendox-compose-scripts/ephemeral/README.md): `./init-env.sh` once, then
`docker compose up -d --wait`.

Prefix commands with `ENV_NAME=EPHEMERAL` if a local `.env` selects an older environment.
Do not edit that file just to run this suite.

```bash
npm install
npx playwright install chromium
```

| Purpose | Command |
|---|---|
| Smoke tests, 60-second maximum on a ready stack | `npm run smoke` |
| Specific tests | `npx playwright test documents` or `npx playwright test -g "upload"` |
| Re-run what failed | `npx playwright test --last-failed` |
| Whole suite | `npm test` |
| List the tests | `npm run list` |
| Open the last report | `npm run report` |
| Run interactively | `npm run ui` |

These are Playwright's own commands; the `npm run` ones are short aliases defined in
`package.json`. Smoke tests are the ones tagged `@smoke` in the code. The smoke configuration
adds a 60-second global timeout, includes fresh browser logins, and uses no retries. Stack
boot and builds happen before that budget. Smoke has no skipped scenarios.

## Frontend version

The default matches what the branch deploys: when `gendox-frontend-v2/` exists, `ui` runs
`tests/v2/{ui,smoke,regression}/` and `streaming-contract` uses the v2 export and fixture.
Without v2, the existing v1 files run. The four setup logins and the API project are shared.
The original v1 specs remain unchanged and selectable explicitly:

```bash
ENV_NAME=EPHEMERAL npm run smoke                 # this branch's frontend
ENV_NAME=EPHEMERAL npm test -- --project=ui       # browser tests and login setup
ENV_NAME=EPHEMERAL npm run test:v2 -- --project=ui
ENV_NAME=EPHEMERAL npm run test:v1 -- --project=ui
```

`E2E_FRONTEND=v1` or `v2` provides the same override for other Playwright commands. The
selected frontend directory must exist. To execute v1 tests on a v2 branch, first serve a
v1 build and set `E2E_FRONTEND_URL` to that frontend; selecting tests does not switch the
running deployment. `smoke:v1` and `smoke:v2` are also available. Use `--list --reporter=list`
to inspect either selection without replacing the HTML report.

The v2 Sources navigation case is marked `@blocked`: this ephemeral stack's metadata
endpoint returns HTTP 500. It remains enabled and fails visibly in full runs, but is outside
smoke. To run the currently runnable browser cases:

```bash
ENV_NAME=EPHEMERAL npm test -- --project=ui --grep-invert @blocked
```

The unchanged API project retains its two database-dependent failures. No application or
database fixes are included. See the [v2 coverage plan](../.ai/e2e-v2-coverage-2026-11-11.md)
for the blocked case, changed v1 interactions and remaining scope.

Smoke scenarios run independently with test-scoped organizations and can be distributed:

```bash
npm run smoke -- --workers=8
npm run smoke -- --shard=1/2
npm run smoke -- --shard=2/2
npm run smoke -- -g "knowledge pipeline"   # this case also works alone
```

Use separate CI checkouts for concurrently running shards; the normal report/history files
are shared within a checkout. Keep setup dependencies enabled. `npm test` includes smoke
and the broader regression cases, including background jobs and the deterministic streaming
contract project. Browser UI mode can hide other projects: enable `setup`, `api`, and `ui`
in its project filter, then run the four setup logins before browser cases.

Useful filters:

```bash
npx playwright test --grep @p1
npx playwright test --grep @p2
npx playwright test --project=streaming-contract
npx playwright test --grep-invert @background
```

The `streaming-contract` project uses a local API fixture rather than the running backend.
All other API/browser projects use the real ephemeral stack with mock models. Background
jobs may take several minutes and never enter smoke. `E2E_UI_WORKERS` controls browser
concurrency (default four), independently of the total `E2E_WORKERS` limit (default eight).
The v2 fixture uses a worktree-specific port; `E2E_STREAMING_PORT` overrides it. The v1
fixture retains its original port, 3520.

`npm run report` displays the most recent invocation, including filtered invocations. Run
`npm test` before opening it to see the complete report. Persistent run summaries are below.

[V2 coverage and remaining journeys](../.ai/e2e-v2-coverage-2026-11-11.md) records the current
scope and service requirements. The [original v1 plan](../.ai/e2e-coverage-2026-11-11.md)
remains unchanged.

## Results and history

Every run ends with a short summary and writes to `test-history/` (not in git):

- `STATUS.md`: every test with its tags, last result, last run and last pass, and the recent runs.
- `runs.jsonl`: one line per run.
- `<run>/failures.md`: for a failed run, each error with its trace, screenshot and the API log.

[AGENTS.md](AGENTS.md) explains how the suite is built and how to write a test. Coding agents
maintain it, and leave shorter findings in [NOTES.md](NOTES.md).

## Other environments

`ENV_NAME=LOCAL`, `DEV` or `E2E` selects the older configurations in `config/`. They predate
the current tests and their seeded users, so expect failures there.

## Run the tests the DEV environment

Create a `.env` file with the ./gendox-e2e-tests directory with the environement variables that are required by `dev.config.json` file, like this:

```bash
ENV_NAME=DEV
SIMPLE_USER_USERNAME=****@test.com
SIMPLE_USER_PASSWORD=****
ADMIN_USER_USERNAME=****@test.com
ADMIN_USER_PASSWORD=****
```

## Page Object Model

The tests will be written using the Page Object Model pattern. For the time being, the tests are written in the `tests` directory and the page objects are in the `page-objects` directory.
In there is also a directory `./page-objects/apis` that contains the equivalent of "page objects" for the API testing.

