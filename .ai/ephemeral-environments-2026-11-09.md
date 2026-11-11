# Ephemeral environments, smoke tests and agent tooling

**Status: mostly implemented on 2026-11-10, not committed.** The environment, the test setup, the
history and the agent docs are built and run. Three of the seven browser journeys are unfinished. See
[Implementation status](#implementation-status). It replaces the
[original plan of 2026-11-06](ephemeral-environments-2026-11-06.md), which is kept as first written.

The [2026-11-11 coverage plan](e2e-coverage-2026-11-11.md) supersedes the smoke selection
and browser-journey scope below. Earlier measurements here are historical.

## Implementation status

| Part | State |
|---|---|
| Plain Compose stack, `.env`, `init-env.sh`; `env.sh` and `e2e.sh` removed | Done. First start 50 s, later `up` 4 s |
| Flyway on every `up`, named volume, frontend served from the mounted `out/` | Done |
| Playwright 1.65, bundled Chromium, one configuration, `setup` / `api` / `ui` projects, npm scripts | Done |
| Organization per test (`support/workspace.js`) | Done. The 37 API tests run in parallel on it |
| History reporter and `test-history/` | Done |
| Smoke set | 13 API tests and 4 browser journeys pass, in about 20 s. Whole suite about 25 s |
| Browser journeys | Document to answer, agent settings, written document, and members and roles pass, and every run logs the four seeded users in through Keycloak. Sign in and out, new workspace, organization settings and insights, and a training test are written but parked as `fixme`; `gendox-e2e-tests/NOTES.md` says what is left |
| Agent docs, deletion rule, Claude Code permission prompt | Done |

Differences from the design below:

- The configuration stays in `config/ephemeral.config.js`, selected by default through the existing
  `tests.config.js`, so the older `LOCAL`, `DEV` and `E2E` configurations keep working untouched.
- Document to answer asks for the split through the API. The Training button queues a background job
  that is too slow for a smoke test, so it has a test of its own outside smoke.
- The fixture retries creating an organization, and the global setup creates one alone first, because
  creating several at the same moment can fail in the API.
- `init-env.sh` was kept, a passing test deactivates its organization, the reporter keeps the last 30
  failed runs, and `NOTES.md` is a tracked file. These were open questions; they can still be changed.

## Goal

Coding agents write most of the code, so they need a fast and predictable way to check their work:

- A quick smoke run between turns, 30 to 60 seconds.
- One to three tests for the feature being worked on.
- The whole suite once, at the end of the work, to confirm nothing regressed.

These run in an environment that is already up and already has data, on any branch. People and agents can
see which tests exist, what ran recently and how it went, and can read a failure later. Any environment can
still be deleted and rebuilt from nothing. The tooling is something an agent may use, not something it must
use.

## What the review changed

| Earlier draft | Now | Why |
|---|---|---|
| `env.sh` with ten commands | Plain Docker Compose and a per-checkout `.env` | Everything except choosing free ports is a standard Compose feature |
| `e2e.sh smoke`, `run`, `full`, `list` | Playwright's own commands and tags, with short npm aliases | Playwright already has all four |
| No record of past runs | A status table, a run history and a folder per run | Requested, and Playwright alone keeps only the last run |
| One organization per run | One organization per test, removed when the test passes | Parallel tests stay apart, and the seeded users do not collect organizations |
| `down --confirmed` flag | A written rule plus a permission prompt | A flag the agent passes itself protects nothing |
| `sync`, `doctor`, `full --fresh` | Dropped | Custom commands with little gain; explicit build commands replace `sync` |

What stays: one environment per checkout, data from Flyway, a named volume, the frontend built on the host,
tags and tiers, agent-maintained notes, and always asking before deleting.

## What exists today

Built in the first stage, not yet committed. The usage guide is `gendox-compose-scripts/ephemeral/README.md`.

- `env.sh` (about 430 lines) starts a full stack per named slug, each on its own ports. It also picks the
  ports, builds images named by content hash, pre-bakes a migrated database image, and holds locks.
- `e2e.sh` creates an environment, runs Playwright, and deletes the environment.
- Keycloak uses an optimized image and a realm JSON file, so no `kcadm` setup runs.
- The API jar comes from the mounted `target/` directory, so a backend change needs no image build.
- The frontend reads its URLs at runtime from `/env-config.js`, so one build serves any port.
- `tests/api-tests` matches the current API, with one logged-in user per role and the mock models.
  There are 37 API tests and 1 browser test, run one at a time.

**Naming, unchanged:** the umbrella term is *ephemeral environment*. Instances are `gendox-eph-<slug>` and
carry a `dev.ctrlspace.gendox.ephemeral` label.

**Rejected after measuring, unchanged:** lazy Spring initialization saved 1 s of 24 s and delays wiring
errors. The Java AOT cache needs a training run per jar, and the jar changes on every edit.

## Measurements

| What | Time |
|---|---|
| Full environment boot today, images built | 24 s |
| All 131 migrations on an empty database (Flyway container) | 3 s |
| Flyway when there is nothing to apply | 1.2 s |
| API rebuild and restart | 21 s |
| Frontend `next build` on the host | 33 to 37 s |
| `yarn install` in an empty folder, machine cache warm | 16 s |
| `yarn install` inside Docker, nothing cached | 244 s |
| Frontend Docker build, dependencies cached | 56 s |

Checked on a scratch stack with plain Compose: a one-shot service runs again on every `up`, `up --wait`
succeeds with it, and a `.env` file sets the project name and the ports.

## Design

### 1. One environment per checkout

Each checkout (the main one or a worktree) has its own Compose project, `gendox-eph-<checkout folder>`. It
is that checkout's development environment and its test environment. Claude in one worktree and Codex in
another each get their own, with their own code mounted. Switching branches keeps the environment.

There is no special "e2e environment" and no branch restriction: tests run on whatever is checked out.

### 2. Plain Docker Compose

`env.sh` is not mandatory, and this plan removes it. What it does today moves to standard places:

| `env.sh` today | Replacement |
|---|---|
| Names the project, sets ports | A `.env` file beside the compose file, one per checkout, already ignored by git |
| Builds the Keycloak image | A `build:` entry in the compose file |
| Runs Flyway | A one-shot `flyway` service the API waits for |
| Bakes a database image | Removed (section 3) |
| Builds the frontend image | Removed (section 5) |
| Rebuilds the jar when sources are newer | The normal Maven command (section 4) |
| `up`, `down`, `ls`, `logs`, `psql` | `docker compose up -d --wait`, `down -v`, `ls`, `logs`, `exec db psql` |
| `info`, `token` | The `.env` file, and a documented `curl` line |

The compose file has no default name or ports. Without a `.env` it stops with a message, so a worktree can
never start on top of another checkout's environment by accident.

**The one thing Compose cannot do** is choose ports that are free. A small `init-env.sh` (about 30 lines)
finds a free slot, writes the `.env`, and copies provider keys from the main checkout if present. It runs
once per checkout. Writing the five lines by hand from `.env.example` works as well.

### 3. Data comes from Flyway, on any branch

A new environment starts from an empty Postgres, runs Flyway including `test-data` and `demo-data`, and
Keycloak imports the realm JSON. The pre-baked database image is removed: migrations take 3 s, so it saved
little and had to be rebuilt on every migration change. The database lives in a named volume, so it
survives container replacement and code updates. Only deleting the environment removes it.

Every `up` runs Flyway in place, with out-of-order migrations allowed and applied migrations missing from
the checkout ignored (`*:missing,*:future`). Tested on a scratch database:

| Situation | Result |
|---|---|
| Branch adds a migration | Applied |
| Switch to a branch without it | Accepted, the applied change stays |
| Branch has a migration older than the latest applied | Applied |
| An applied migration was edited | Flyway stops with a checksum error |

The last case, and any migration that fails, means the environment can no longer follow this code. The
agent then asks whether to delete and recreate it. The same applies when the realm JSON changes, because
Keycloak imports it only into an empty database.

### 4. Bringing code into the environment

Standard commands, run when that part changed:

| Changed | Command | Time |
|---|---|---|
| Backend | `mvn -q package -DskipTests`, then `docker compose restart api` | 21 s |
| Frontend | `yarn build` | about 35 s |
| Migrations | `docker compose up -d --wait` | 1 to 3 s |
| Nothing | Nothing | 0 s |

Playwright's global setup checks that the environment answers, and warns when the jar or the frontend build
is older than the sources, naming the command to run. It does not build anything itself.

### 5. Frontend build and caching

Starting with nothing cached is unusual. It happens on a new machine, or inside Docker when the layer cache
is lost. Normally one of these applies:

- **Docker:** the `yarn install` layer is reused until `package.json` or `yarn.lock` changes.
- **Host:** `node_modules` stays in the checkout. A new worktree has none, but Yarn fills it from the
  machine-wide cache in 16 s, with no download.

The 244 s figure was a forced no-cache Docker build, so it is the worst case, not the normal one. Reusing
the host `node_modules` inside a Linux container does not work, because some packages contain
platform-specific binaries.

The plan builds on the host: `yarn build` writes the static `out/` folder, and an nginx container serves it
from a mount. No frontend image is built. A backend-only change costs nothing here.

For an agent working mostly on the UI, 35 s per change is long. `next dev` on the host, pointed at the same
API and Keycloak, is the alternative for that case. Its first-visit compile time has not been measured.

### 6. Tests run with Playwright itself

`e2e.sh` is removed. Playwright is upgraded from 1.40 to the current release, which adds tags,
`--last-failed` and `--only-changed`, and replaces a bundled Chromium that does not start on current macOS.
The image in `gendox-e2e-tests/Dockerfile` is upgraded with it.

| Purpose | Command, from `gendox-e2e-tests` |
|---|---|
| Smoke, between turns | `npm run smoke` (`playwright test --grep @smoke`) |
| Specific tests | `npx playwright test documents` or `-g "upload"` |
| Re-run what failed | `npx playwright test --last-failed` |
| Whole suite | `npm test` |
| What tests exist | `npm run list` (`playwright test --list`, add `--grep @smoke` to filter) |
| Last report, in a browser | `npm run report` |
| Debug one test | `npx playwright test -g "upload" --ui` |

One `playwright.config.js` reads the environment's `.env` for its URLs. It has three projects: `setup`
logs in each seeded user once and saves the session, `api` holds the API tests, and `ui` holds the browser
tests and starts from the saved sessions. Tags are written in the test code, which is the single source of
truth for what is smoke.

### 7. Isolation

A fixture gives each test that changes data its own organization, created through the API, with the seeded
users added in the roles the test needs. A new organization gets the default plan, so one test's usage
never counts against another's. Tests therefore run fully in parallel, and data from earlier runs does not
affect later ones. Seeded data is read-only.

When a test passes, the fixture deactivates its organization through the API. When it fails, the
organization is kept so the failure can be inspected in the application. This keeps the seeded users'
organization lists short. Existing tests that rely on exact counts, fixed names or changes to seeded rows
move to this model.

### 8. Smoke set

Around 8 API tests, taken from the existing ones by tagging: health, a token for each role, profile, read a
project, a refused access, upload and split, search, a mock completion. They take a few seconds.

Seven browser journeys. Each is one flow, uses its own organization, and shares nothing with the others, so
all seven run at the same time:

| Journey | Flow | Covers |
|---|---|---|
| Sign in and out | New browser, open the app, log in at Keycloak, land on home, log out | Runtime config, OIDC, realm and theme, route guard, logout |
| New workspace | Create an organization, create a project, find it in the sidebar, rename it, reload | Create organization, create project, navigation, project settings General |
| Document to answer | Upload a text file, see it listed, open it and see its sections, ask about it in chat, get a streamed mock answer, see the thread listed | Upload, splitting and embedding, document page, chat, streaming, threads |
| Written document | Create a document in the editor, save, edit one section, reload | Create document, section editing |
| Agent settings | Open project settings AI agent, choose the mock model, change the instructions, save, reload | Agent configuration, model list |
| Members and roles | A reader is added through the API, appears under Members of the organization and the project, opens the project in a second browser session, and is refused a write action and another organization | Both Members tabs, role limits in the UI, guard refusal |
| Organization settings and insights | Rename the organization, create an API key and see it listed, then create a Document Insights task, add a document and a question, run it and see the answer | Organization settings General and Advanced, tasks list, insights table, generation |

Not in smoke: Earth Observation (needs a Google sign-in), email invitations (no mail server), document
digitization, integrations and web scraping (external services), embedded chat, and the admin skills page.
The first two cannot run locally; the rest belong in the full suite.

**Time.** Seven journeys in seven parallel workers should take as long as the slowest one, estimated at 20
to 30 s, plus a few seconds for the logins and the API tests. That fits the 30 to 60 s target when the code
is already built. A backend change adds its 21 s rebuild, a frontend change its 35 s.

**Locators.** The frontend has no test IDs today. Journeys use roles and visible labels first, and add
`data-testid` only where those are ambiguous, which is a small frontend change per journey.

### 9. Seeing tests and results

| Question | Where |
|---|---|
| What tests exist? | `npm run list` |
| How did the last run go? | `npm run report`: the HTML report with trace, screenshot and video per failure |
| What is the state of every test? | `test-history/STATUS.md` |
| What ran recently? | `test-history/runs.jsonl` |
| What exactly failed last Tuesday? | `test-history/<run>/` |

Playwright keeps only the last run, so a small reporter (about 100 lines, using Playwright's reporter
interface) writes the history after every run. It is the only custom code on the test side.

- `STATUS.md`: one row per test with its tags, last result, when it last ran, when it last passed, and how
  many runs in a row it has failed. Tests that never ran are listed as such.
- `runs.jsonl`: one line per run with the time, branch, commit, whether the checkout had uncommitted
  changes, the command, the counts and the duration.
- `test-history/<run>/`: `failures.md` with each failed test's name, file and line, error and the steps
  before it, plus its trace and screenshot, and the API log for the time of the run. Passing runs keep only
  their line in `runs.jsonl`.

The reporter ends its terminal output with one summary line and the path to `failures.md`, so an agent
reads a few lines instead of the whole log. `test-history/` is ignored by git and belongs to the checkout.
It keeps the last 30 failed runs.

Allure and hosted dashboards were considered. They give history too, but add a Java tool or an external
service for what a short reporter does.

### 10. Agent documentation

- `gendox-e2e-tests/AGENTS.md`, maintained by the coding agents as the suite evolves: the commands, the
  tiers, how to write a test and its fixture, how to choose smoke tests, where results are, known flaky
  areas. It states that the tooling is available and optional, so checking in a browser directly is fine.
- `gendox-e2e-tests/CLAUDE.md` containing only `@AGENTS.md`, because Claude Code reads `CLAUDE.md`.
- `gendox-e2e-tests/NOTES.md` for findings between runs: dated, short, appended by agents. Anything
  lasting moves into `AGENTS.md`. It follows the same public-repository rules as this folder, and uses
  `merge=union` in `.gitattributes` so parallel worktrees do not conflict.
- Root `CLAUDE.md` and `AGENTS.md` point to these as the fast way to check work.

### 11. Deleting

`gendox-eph-*` environments hold nothing important and can always be rebuilt, but **an agent always asks
the user before deleting one**, or anything else. This replaces the current wording, which says no
confirmation is needed.

- The rule is stated in root `AGENTS.md`, root `CLAUDE.md`, the ephemeral `README.md` and
  `gendox-e2e-tests/AGENTS.md`.
- A checked-in Claude Code permission rule makes `docker compose down`, `docker volume rm` and Docker
  `prune` commands prompt the user every time. Other agents have the written rule only.
- `docker compose stop` keeps all data and needs no question.
- The two automatic removals in this plan are a test deactivating the organization it created and the
  reporter dropping run folders beyond the last 30. Both are listed under Open questions.

### 12. Later

- **Team feature server:** a second compose file with versioned images instead of mounted code, a real
  hostname, TLS and its own secrets, named `gendox-shared-*`. Not part of this work.
- **CI:** the same two commands, `docker compose up -d --wait` and `npm test`, on a new environment. This
  is also the proof that everything rebuilds from nothing.

## Order of work

1. Compose file: named volume, Flyway service, Keycloak build, mounted `out/`, `.env`, `init-env.sh`.
   Remove `env.sh` and `e2e.sh`.
2. Deleting rule in the docs and the permission rule.
3. Upgrade Playwright. One config with the three projects, saved logins, npm scripts.
4. Organization-per-test fixture. Move the existing API tests to it and tag the smoke ones.
5. History reporter.
6. The seven browser journeys, then measure the smoke run against the target.
7. Agent docs: `AGENTS.md`, `CLAUDE.md`, `NOTES.md`, root docs.

## Open questions

1. Keep the small `init-env.sh`, or write `.env` by hand?
2. May a passing test deactivate the organization it created, and may the reporter drop run folders beyond
   the last 30, without asking each time?
3. Should `NOTES.md` be committed (shared, but in a public repository) or kept local?
4. Are the browser journeys written for the current frontend now, or is a new frontend close enough to
   wait for?
5. The older `local`, `dev` and `e2e` Playwright configs no longer match the rewritten tests. Keep them
   untouched, or remove them?

## Not yet verified

- The smoke time. The journeys are not written, so 30 to 60 s is an estimate.
- That each journey can be driven reliably through the current UI without test IDs.
- That the default plan of a new organization allows everything one journey does.
- How long the upload-to-answer path takes in the browser with the mock models.
- That the bundled Chromium of the current Playwright starts on current macOS.
- Boot time of the plain Compose stack, expected to be about 30 s.
