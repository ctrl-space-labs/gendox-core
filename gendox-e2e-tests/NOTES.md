# Notes between runs

Findings by coding agents, newest first: dated, short, one entry per finding. When a
finding turns out to be lasting, move it into `AGENTS.md` and delete it here. This file is
public: no secrets, no absolute paths, no details of unfixed security weaknesses.

## 2026-11-11

- **P1/P2 expansion:** new `tests/regression/` cases cover documents, chat, roles, tasks,
  settings, keys/connectors, search, embedding and scheduled Insights/Digitization. All
  four formerly parked browser journeys are executable. The coverage plan records what
  remains; this does not mean every scenario in the original backlog is implemented.
- Final combined run: **120 passed, 3 failed, no skips/retries, 87 seconds**. Failures are
  Sources metadata through API and browser, plus task filtering, each receiving HTTP 500
  on this stack. They remain visible and unchanged. `npm run report` now opens this full
  run; `test-history/STATUS.md` records the individual pass history.
- **Chat smoke** now checks a question, follow-up, tool call/result and persisted reload.
  Sources navigation is a separate independent smoke case with its own document/thread.
  Latest smoke: 19 passed, one Sources metadata HTTP 500 failure, no skips/retries,
  23.0 seconds including real logins. No source-query, filtering or schema fixes were made.
- The mock adapter can request real `advanced_search`, produce structured Insights answers,
  and return stable embedding vectors. Three focused unit tests pass. The adapter does not
  emulate relevance, answer quality, external credentials or OCR image understanding.
- Attaching immediately after creating a chat can race the thread URL/state transition.
  The attachment regression opens a persisted thread and waits for its saved answer first;
  it then uploads, sends a follow-up, reloads and verifies downloaded bytes.
- Embedded chat waits for the agent in `#chat-conversation-header`: the first matching
  agent name can be in the hidden drawer, and the textbox can render before thread setup.
  Browser actions remain bounded independently of the 30-second API request budget.
- Playwright UI's project filter can show only `setup`. Enable application projects to see
  their cases. `npm run report` shows the latest invocation, even if it was one API test;
  `npm test` produces the combined report. Existing streaming fixture tests now participate
  through the separate `streaming-contract` project.

### Initial smoke implementation (before P1/P2 expansion)

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
