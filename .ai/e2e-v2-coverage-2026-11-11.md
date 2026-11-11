# Application e2e coverage for frontend v2

This is the current plan for branches containing `gendox-frontend-v2`. The original
review and v1 scope remain unchanged in `e2e-coverage-2026-11-11.md`.

## Deployment and selection

The v2 branch's root Compose builds `gendox-frontend-v2`, and its ephemeral frontend
mounts `gendox-frontend-v2/out`. Both the live container mount and the served
`/gendox/agent-home/` export were checked. Builds and environment startup precede test timing.

`gendox-e2e-tests/config/frontend.js` selects v2 when that directory exists and v1
otherwise. `E2E_FRONTEND=v1` or `v2` explicitly selects a version; a missing directory
is an error. The `test:v1`, `test:v2`, `smoke:v1` and `smoke:v2` scripts expose those choices.
Explicit v1 execution needs an actual v1 frontend, supplied with `E2E_FRONTEND_URL` if
the checkout's stack serves v2. Selection does not replace or restart deployments.
Use `ENV_NAME=EPHEMERAL` so a local `.env` selecting an older environment cannot win.

The `api` project and its files are unchanged. `setup` retains the four real Keycloak
logins. The `ui` project selects the corresponding browser files; the `streaming-contract`
project selects the corresponding frontend export, fixture and specs. Report metadata
records the selected frontend. No v1 spec or v1 streaming fixture is edited: future v1
journey changes can merge independently of the new files under `tests/v2`.

## Browser scope

There are 31 v2 browser cases, including the independently owned eight smoke journeys.
Each mutating case uses a private organization. Browser concurrency remains configurable,
defaults to four, and runs beneath the total eight-worker limit. No smoke case uses shared
workspace state, serial execution, skipped tests or retries. The whole smoke invocation,
including real logins and the unchanged API smoke scenarios, retains its 60-second cap.

| Tier | Journeys |
|---|---|
| Smoke | Organization legal-name persistence; API key creation/reload; task creation/reopen; agent creation wizard/workspace; reader settings locked; knowledge upload/read, question/follow-up, tool call/result and saved conversation; saved instructions used in chat; written document/read after reload |
| Authentication | Real login/logout/protected navigation; invalid password; saved-session deep link/reload; organization and first-agent creation |
| Workspace | Description and processing switch; agent rename; organization address/phone; stale selected IDs; narrow-screen upload; task rename and deletion cancellation |
| Documents/search | Unsupported-file rejection; direct document URL/reload; global agent and document search; profile identity/organizations; real widget answer and session restoration |
| Conversations | Copy saved answer; attachment/follow-up/reload/original-byte download; Sources document navigation |
| Jobs/members | Insights document/question selection, generated cell and reload; Process now and indexed search; owner/reader member lists, read-only settings and organization boundary |

These cases exercise the real frontend, authentication, API, persistence, retrieval tool
and jobs with mock models. They make no paid provider calls and do not test ProvenAI.
The training fixture explicitly enables automatic processing, matching the v2 creation
wizard; the generic API workspace fixture otherwise leaves that value unset.

## Changed or unavailable v1 interactions

- The v1 upload queue's “remove selected files before sending” interaction has no v2
  counterpart: v2 uploads as soon as files are chosen. It is not invented or silently
  treated as passing. A separate v2 validation case checks unsupported-file rejection.
- Creating a project is now a two-step agent wizard. Tasks open directly after creation.
  Knowledge rows open a preview, whose Open link leads to the full document.
- Settings tabs became separate agent/organization pages. Readers get disabled controls
  instead of an editable form that submits a refused update.
- Global search remains available through the v2 command palette. Chat uses dock tabs
  and hash links; existing conversation links reopen persisted threads.

## Streaming contract

The three existing behaviors have v2 equivalents: incremental text/reasoning, asynchronous
host-tool continuation and navigation/resumption of a saved answer. The separate fixture
serves the v2 export and an explicit runtime API URL. Its port is derived from the checkout's
frontend port and can be overridden with `E2E_STREAMING_PORT`, avoiding other worktrees.
This mock API fixture uses one worker because it owns shared protocol state. It is excluded
from smoke and does not stand in for real-stack persistence or model quality.

## Blocked and remaining scope

The Sources browser case is enabled, annotated `@blocked`, and excluded from smoke because
the ephemeral metadata endpoint returns HTTP 500. It still fails visibly in the full run;
`--grep-invert @blocked` selects only currently runnable browser coverage. Its document-link
steps cannot be validated beyond that response until the environment is addressed separately.
The unchanged API project retains its source-metadata and task-filter database failures.
No backend code, migrations, API tests, profiles or feature flags are changed here.

The broader backlog remains: real token expiry/refresh, chat stop/error/retry, document and
task negative paths, full accessibility/viewport coverage, admin skill publishing, usage
limits, and deterministic upstream fixtures for Git/S3/API/Firecrawl execution. Invitations
need a mail sink; Earth Observation needs a separate service-enabled tier. ProvenAI is excluded.

Locators use roles, visible labels and scoped sections/conversations. No `data-testid`
attributes or frontend application changes were needed.

## Validation

| Command (with `ENV_NAME=EPHEMERAL`) | Result | Duration |
|---|---|---|
| `npm run smoke` | 19 passed, no skips/retries | 17.2 s |
| `npx playwright test --project=ui --grep-invert @blocked` | 34 passed, including four logins; no skips/retries | 64 s |
| `npx playwright test --project=streaming-contract` | 3 passed | 12.7 s |
| `npm test` | 120 passed, 3 failed; no skips/retries | 67 s |

Default and explicit v1 UI listings each contain four shared logins and exactly 31
browser cases, from their respective folders. No v2 files appear in the v1 selection.
The combined run contains 83 passing API cases and the two unchanged database failures,
four passing logins, 30 passing v2 browser cases and the blocked Sources case, plus three
passing v2 streaming contracts. The only browser failure reaches the real metadata endpoint
and receives HTTP 500; it is not a missing v2 locator or an expected-failure assertion.
The HTML report is the complete combined invocation.

### Validation after merging the latest v2 completion changes

The merged backend was rebuilt and restarted before these checks. The upload smoke case
now waits for the visible Uploaded state and for its dialog to close before opening the
document; this removes a test interaction race without changing application behavior.

| Check | Result | Duration |
|---|---|---|
| Completion/runtime/tool/mock adapter unit tests | 49 passed | Unit tests |
| `npm run smoke` | 19 passed, no skips/retries | 14 s |
| `npm test` | 120 passed, 3 failed; no skips/retries | 64 s |

The three failures are the same documented source-metadata API/browser and task-filtering
HTTP 500 responses. No additional failures remain after integrating the completion changes.

Persistent local reports include traces and API logs; generated reports, sessions and
environment secrets remain ignored. No push or tracker ticket is part of this work.
