# One smoke suite for local, dev and prod

## Goal

"Smoke test" meant two things: the quick e2e run a coding agent makes between turns, and the
manual check after deploying to dev or prod. They are now one suite, the `@smoke` tests,
run against different targets with different models:

| | Target | Models | When |
|---|---|---|---|
| `npm run smoke` | this checkout's ephemeral stack | mock | between turns, 60-second cap |
| `npm run smoke:dev` | dev | small: a cheap model of every provider | after every dev deploy |
| `E2E_CONFIRM_PROD=yes npm run smoke:prod` | prod | small, or large now and then | after a prod deploy |

Two settings drive everything: `E2E_TARGET` (`local`, `dev`, `prod`) and `E2E_MODELS`
(`mock`, `small`, `large`). The tests do not change between targets.

## Decisions

- **No new backend API and no janitor.** Cleanup uses the delete APIs the application
  already has; organizations and projects end deactivated, the only removal they offer.
- **Only `@smoke` runs on a deployed target**, also for `npm test`. Smoke tests must not
  depend on seeded data: no seeded ids or organizations; user ids come from profiles.
- **Every test works in its own organization**, as locally. On a deployed target it removes
  what it made also after a failure (`E2E_KEEP_FAILED=1` keeps it).
- **A write guard** refuses, before sending, any change that does not name an organization
  or project the worker created. It covers the API context and the browser's API calls.
- **Real models only in the LLM tests** (`tests/llm`). Every other test uses the mock models
  on every target, so a deploy check costs only what the LLM tests send.
- **One Playwright project per provider** (`llm-openai`, `llm-anthropic`, …) runs the LLM
  tests in parallel and names the adapter that broke.
- **Non-deterministic answers** are checked by contract, not wording: a canary document
  with an invented code, agent instructions saying it is under test, the stored tool call
  and its results, and one instruction to follow (lower case). One retry, on real models.
  The model chooses to search (`AUTO`); the mock is forced (`ALWAYS`).
- **Subscriptions belong to organizations**, and a new organization has the free plan.
  With real models the LLM tests make their project in one subscribed organization per
  environment (`E2E_LLM_ORGANIZATION_ID`), and remove only that project. Test usage on
  prod counts toward that real subscription, by decision.
- **A request budget** (`E2E_MAX_LLM_REQUESTS`) caps chat messages and task runs per run.
- **Production asks first** (`E2E_CONFIRM_PROD=yes`).
- **Logins:** the password grant on a client that allows it, or
  `E2E_TOKEN_SOURCE=browser`, which refreshes the browser sessions of the setup project, so
  no realm setting has to change.

## What cleanup leaves behind

Measured for one smoke run (21 tests, mock models) on the local stack with the deployed cleanup:

- Deleted, none left: documents, sections, their embeddings, tasks, task nodes and answers.
- Left, small rows: about 15 organizations and their projects with agents, deactivated
  and renamed DEACTIVATED, without members; 6 deactivated chat threads with 27 messages;
  7 embeddings of search queries; 1 revoked API key; 78 audit log rows; usage records.
- Left in storage: the uploaded files (a few small text files), because deleting a
  document does not remove its file.

That is a few hundred small rows and a few kilobytes of files per run: negligible at one
run per deploy.

A deletion API for organizations, threads and stored files would remove the rest. It is a
product decision, outside this work.

## Prerequisites per deployed environment

Made once by hand, so the tests hold no admin power (no Keycloak admin client, no
super-admin account):

- Five test accounts in the realm, sharing one password that CI keeps as a secret.
- For real models, one organization on a paid plan, administered by test account 1.

The global setup (`support/preflight.js`) checks both before any test and stops with what
to fix. Locally the seeded users and seeded organization 1 play these parts.

The environment itself must have the mock models active, as the main migrations create
them, and the provider keys the tier's models need. `deployed.env.example` in
`gendox-e2e-tests` lists every variable.

## Files

`gendox-e2e-tests/`: `config/target.js`, `config/models.js`, `config/suite.js`,
`config/deployed.config.js`, `support/guard.js`, `support/cleanup.js`, `support/llm.js`,
`tests/llm/agent.spec.js`, `fixtures/llm/halvorsen-archive.txt`. `AGENTS.md`, section
"Deployed environments", is the user guide.
