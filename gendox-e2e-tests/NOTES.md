# Notes between runs

Findings by coding agents, newest first: dated, short, one entry per finding. When a
finding turns out to be lasting, move it into `AGENTS.md` and delete it here. This file is
public: no secrets, no absolute paths, no details of unfixed security weaknesses.

## 2026-11-11

- Smoke coverage now lives in `tests/smoke/` plus the existing agent-settings,
  document-to-answer and written-document journeys. The old serial CRUD chains and three
  unfinished journeys no longer carry smoke tags. No application code was changed.
- The complete smoke run passed 19 checks (15 scenarios plus four real browser logins),
  with eight workers, no skips/retries, in 27.9 seconds. The full run passed 57 with the
  four pre-existing unfinished browser cases skipped, in 28.5 seconds. Both native shards
  also passed separately: 12 checks in 8.0 seconds and 11 checks in 26.9 seconds,
  each including its own four logins.
- Browser project creation uses an organization owned by testUser3 so other smoke cases
  do not change that user's memberships while the frontend refreshes its profile.
- The current review and prioritized remaining journeys are in
  [the coverage plan](../.ai/e2e-coverage-2026-11-11.md). The older findings below remain
  applicable to the unfinished full-suite journeys.

## 2026-11-10

- **Unfinished browser journeys**, marked `test.fixme` so the runs stay green:
  - `new-workspace`: renaming the project answers 200, but the old name is shown after a
    reload. Not known yet whether the form sends the old name or the page shows stale data.
  - `organization-settings-and-insights`: written up to the "Select Project Documents" dialog
    of a Document Insights task. Next: tick the row, "Confirm Selection", "Add Questions",
    "Generate New", then check the answer cell.
  - `training`: never run. The Training button queues a job that the API picks up on a
    schedule; how long that takes here is not measured.
- **`document-to-answer` and `agent-settings` run again.** The chat drops a message typed
  before the agent is set, so both now wait for the agent name in the chat header before
  typing. After that, both passed in ten suite runs in a row, and alone in 14 and 8 runs.
  Earlier the same day they had failed: `document-to-answer` with the chat staying on
  "Generating answer..." while the thread's `completion-status` poll was denied, and
  `agent-settings` with an empty project name on the first load of the settings page. Neither
  could be reproduced afterwards, also not with a saved login older than the token lifetime.
  If one fails again, the run's folder in `test-history/` has the trace and the API log.
- **`sign-in` is parked too.** It failed in about three runs of eight: after logout, Keycloak
  redirects back to the login page, and the test's next navigation races with that chain
  (`ERR_ABORTED`). Logging in itself is covered on every run by `tests/ui/auth.setup.js`.
- **Possible application issues seen while writing the tests**, not changed:
  - Chat: `sendMessage` (`gendoxChat.js`) throws, without a message, when the user or the agent
    is not set yet, and the input is cleared anyway. The message is lost with no feedback.
  - Project settings crashes when a tab is clicked before the project has loaded.
  - A document written in the editor shows "No sections available" after saving.
- The seeded user `testuser1@test.com` collected about a hundred `e2e …` organizations while
  the fixture was being debugged. They slow nothing down noticeably, and a rebuilt
  environment starts clean.
