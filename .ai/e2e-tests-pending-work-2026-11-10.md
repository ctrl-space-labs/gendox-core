# End-to-end tests and ephemeral environments: pending work

Status: historical handover, written 2026-11-10. The current smoke scope and remaining
application coverage are tracked in [the 2026-11-11 plan](e2e-coverage-2026-11-11.md).
The unfinished journeys below remain in the full-suite backlog, outside smoke.

The setup itself is built and described in
[ephemeral-environments-2026-11-09.md](ephemeral-environments-2026-11-09.md). This file lists only what
is left. Read these first:

- `gendox-e2e-tests/AGENTS.md`: how the suite works and how to read its results.
- `gendox-e2e-tests/NOTES.md`: findings so far, per test.
- `gendox-compose-scripts/ephemeral/README.md`: how to start the environment of a checkout.

## Where things stand

- `npm run smoke`: 17 pass, 3 skipped, in about 20 s. `npm test`: 45 pass, 4 skipped, in about 25 s.
- Skipped tests are marked `test.fixme`, so Playwright reports them as skipped and the runs stay green.
- Every failed run keeps its trace, page snapshot and API log in `gendox-e2e-tests/test-history/`.
  Start with `STATUS.md` there.

## Rules for this work

- Do not commit, push or open a pull request unless the user asks.
- Ask the user before deleting anything: an environment, a volume, an image, build cache, data.
- Do not spend time on tests of DIDs, waltID or verifiable credentials. That part of the API is due to
  be removed.
- When a test fails because the application is wrong, do not work around it silently and do not change
  the application. Write the finding in `NOTES.md` and tell the user.
- Everything here and in `NOTES.md` is public. Details of unfixed security weaknesses belong in the
  private tracker.

## 1. Finish the skipped browser tests

All are in `gendox-e2e-tests/tests/ui/`. A test is done when it passes in ten suite runs in a row
(alternate `npm test` and `npm run smoke`); then remove `test.fixme` and update `NOTES.md`.

| Test | What is known | Next step |
|---|---|---|
| `sign-in.spec.js` | Logging in works. After logout, Keycloak redirects back to the login page, and the next navigation of the test races with those redirects (`ERR_ABORTED`). Failed in about three runs of eight | Find a state to wait for that marks the end of the redirects, instead of navigating right away |
| `new-workspace.spec.js` | Renaming the project answers 200, but the old name is shown after a reload | Find out whether the form sends the old name or the page shows old data. If the application is wrong, report it |
| `organization-settings-and-insights.spec.js` | Written up to the "Select Project Documents" dialog of a Document Insights task | Tick the row, "Confirm Selection", "Add Questions", "Generate New", then check the answer cell |
| `training.spec.js` | Never run. The Training button queues a job that the API picks up on a schedule | Measure how long the job takes here, then decide whether the test fits the full run. It is not a smoke test |

## 2. Watch the two tests that were just enabled

`document-to-answer.spec.js` and `agent-settings.spec.js` passed in ten suite runs in a row after they
got a wait for the agent name in the chat header. Earlier the same day they had failed, and the cause
was never found:

- `document-to-answer`: the chat stayed on "Generating answer..." while the page's request for the
  status of the turn was refused.
- `agent-settings`: the project name was empty on the first load of the settings page.

If either fails again, read the trace and the API log of that run before changing the test. If it turns
out to be an application fault, report it.

## 3. One API test that fails now and then

`Organizations CRUD API › Create and Deactivate Organization` in
`tests/api-tests/organizations.spec.js` failed once in ten runs, on creating the organization. The
other tests create organizations through `support/workspace.js`, which retries a server error; this one
calls the API directly. The cause was not confirmed in the API log. Confirm it, then give this test the
same retry.

## 4. Check the frontend Dockerfile change

`gendox-frontend/Dockerfile` got `RUN --mount=type=cache` on `yarn install` and `yarn build`. These lines
need BuildKit. How the dev and production images are built is not visible in this repository, so it is
not known whether those builds have it. The ephemeral environment does not use this image.

Ask the user how the images are built. If BuildKit is not certain there, revert the two lines.

## 5. Clean up, only with the user's agreement

Nothing was deleted so far. Ask before each of these:

- Docker build cache: about 19 GB reclaimable, and the disk of the Docker VM was almost full.
- Two unused images from an earlier design: `gendox-eph-db` and `gendox-eph-frontend`.
- About a hundred `e2e …` organizations of the seeded user `testuser1@test.com`, left from debugging.
  They do no harm, and a rebuilt environment starts clean.

## 6. Application findings to hand to the user

Seen while writing the tests, not changed. The user decides whether they become tickets; do not create
tickets unasked.

- Chat: a message typed before the agent has loaded is dropped. The input is cleared and nothing is sent.
- Project settings crashes when a tab is clicked before the project has loaded.
- A document written in the editor shows "No sections available" after saving.
- Right after an organization, project or member changes, a user can briefly get old data about their
  own access.
- Creating several organizations at the same moment sometimes answers a server error.

## Done when

- The four skipped tests pass or have a written reason to stay skipped.
- Smoke and full runs are green ten times in a row.
- The Dockerfile question is answered.
- `NOTES.md`, the status table in the main plan and the Pending plans lines in `CLAUDE.md` and
  `AGENTS.md` say what is true.
