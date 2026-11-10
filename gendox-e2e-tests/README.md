# Gendox End-2-End Tests

This directory contains the end-2-end tests for Gendox. These tests are written in Playwright JS. 
The tests **must** run before each PR to `dev` or `main` branches.




## Run the tests

The tests run against this checkout's ephemeral environment. Start it first, as described in
[its README](../gendox-compose-scripts/ephemeral/README.md): `./init-env.sh` once, then
`docker compose up -d --wait`.

```bash
npm install
npx playwright install chromium
```

| Purpose | Command |
|---|---|
| Smoke tests, about 20 seconds | `npm run smoke` |
| Specific tests | `npx playwright test documents` or `npx playwright test -g "upload"` |
| Re-run what failed | `npx playwright test --last-failed` |
| Whole suite | `npm test` |
| List the tests | `npm run list` |
| Open the last report | `npm run report` |
| Run interactively | `npx playwright test --ui` |

These are Playwright's own commands; the `npm run` ones are short aliases defined in
`package.json`. Smoke tests are the ones tagged `@smoke` in the code.

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

