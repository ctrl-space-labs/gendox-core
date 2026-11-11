---
sidebar_position: 4
title: End-to-end tests
description: The Playwright end-to-end test suite of Gendox - what it covers, how to run the quick smoke check or the full suite against a local test environment, and where to read the results.
---

# End-to-end tests

`gendox-e2e-tests/` holds the end-to-end tests: [Playwright](https://playwright.dev) tests that use Gendox the way people do, through the browser and the API. They run against a [local test environment](./ephemeral-environments.md), which must be up.

## What they cover

| Group | What it checks |
|---|---|
| **Smoke** (`@smoke`) | The paths nobody can work without: sign in, create an agent, upload a document, open it, chat. About 30 seconds. |
| **API** | The REST API: organizations, agents, documents, members and roles, access rules. |
| **Browser** | Journeys in the web app: the agent wizard, knowledge, chat, members, tasks, sign-out. |
| **Regression** | Bugs fixed earlier, so they stay fixed. |
| **Streaming** | The chat's streaming protocol, against a mock server. |

Tests run in parallel. Each test that changes data works in an organization of its own, so tests don't disturb each other or the seeded data. Agents created by the tests use the mock models, so the suite needs no provider key and costs nothing.

## Run them

From `gendox-e2e-tests/`, the first time:

```bash
npm install && npx playwright install chromium
```

| When | Command |
|---|---|
| Quick check after a change | `npm run smoke` |
| The tests of one area | `npx playwright test documents` (a file name), or `-g "upload"` (a title) |
| Re-run what failed | `npx playwright test --last-failed` |
| Everything | `npm test` |
| List the tests | `npm run list` |
| Open the last report in a browser | `npm run report` |

The tests run the **built** code. After changing the API or the web app, rebuild as described in [Local test environments](./ephemeral-environments.md#after-changing-code); the run warns about a stale build.

The suite selects the tests of the new web app (`gendox-frontend-v2`) by default. `npm run test:v1` / `test:v2` and `smoke:v1` / `smoke:v2` select explicitly.

## Read the results

A run ends with a short summary: the counts, each failed test with its first error, and where the details are. Every run is recorded in `test-history/` (not committed):

- `STATUS.md`: every test, its tags, last result and last pass.
- `<run>/failures.md`: for each failed test, the error, its last steps, a screenshot, a trace, a snapshot of the page, and the API's log during the run.

## Write a test

`gendox-e2e-tests/AGENTS.md` explains the conventions: the isolation fixtures, the page helpers, how to locate elements by role and visible label, and how to tag a smoke test.
