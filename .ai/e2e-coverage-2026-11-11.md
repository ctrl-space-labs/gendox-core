# Application e2e coverage

Status: smoke implemented and validated locally, 2026-11-11; full-suite expansion is the backlog below.
This is the current coverage plan. The November 6 and 9 environment plans describe the setup;
the November 10 handover retains the history of unfinished journeys.

## Review

The earlier suite had 37 API cases, four authentication setup cases, four enabled browser
journeys, and four unfinished browser journeys. A baseline smoke run passed 17 cases and
skipped three in 17.2 seconds. Those counts included authentication setup.

Problems with the earlier smoke selection:

- Document and embedding tests used serial groups and state produced by preceding tests.
  Running a tagged case alone or putting cases in different shards could change its outcome.
- Three unfinished journeys carried the smoke tag, so a green run included skipped coverage.
- The members journey combined several screens, two browser contexts and a second organization.
- Organization/project read cases paid for unrelated organization creation in file hooks.
- Browser storage-state filenames were shared by separate invocations in a checkout.

The replacement uses independent API scenarios, focused browser scenarios and the three existing
core browser journeys. Existing CRUD cases remain in the full suite. The unfinished journeys
remain explicitly unfinished; the smoke selection does not include them.

## Smoke contract

`npm run smoke` uses `playwright.smoke.config.js`: a 60-second global timeout, no retries,
parallel tests, and real authentication setup. The budget covers setup and tests on an already
built, running stack. It excludes package installation, browser installation and stack boot.
A timeout fails the run; it must never silently drop cases to meet the budget.

Every mutating smoke case owns an organization through the test-scoped fixture. Read-only cases
use seeded data. No smoke scenario uses `sharedWorkspace`, serial execution, fixed delays or
data from another scenario. Organization/project creation and role assignments use the established
access-cache readiness helper. Browser contexts start from fresh logins saved in an invocation-specific
directory. No external model, mail server, Google account or paid provider is needed.

### Coverage

| Layer | Independent scenario | Checks |
|---|---|---|
| API | Health | Application and database health are UP |
| API | Four identities | Real token issuance and the correct profile for each seeded user |
| API | Project access | Same project route succeeds for a member and refuses an outsider |
| API | Knowledge pipeline | Upload, split, embedding vectors, search returns this document's sections, mock completion and thread ID |
| Browser | Organization settings | Change display name, reload, read persisted value |
| Browser | API key management | Create a named key and find it after reload |
| Browser | Project creation | Submit creation form, reach home, find project, verify stored fields |
| Browser | Tasks | Create Document Insights, open it, reload saved task |
| Browser | Reader access | Load settings, refuse update, reload unchanged value |
| Browser | Document to answer | Upload, open sections, send question and display mock answer |
| Browser | Agent settings | Save instructions/model settings, reload, use them in chat |
| Browser | Written document | Create in editor, add section, read saved section after reload |
| Setup | Four browser logins | Runtime frontend configuration, OIDC redirects, Keycloak and profile loading |

Smoke cases also run as part of `npm test`. Setup is a project dependency and is intentionally
repeated on each shard. Use `npm run smoke -- --shard=1/2` and `--shard=2/2` on separate CI
checkouts (or sequentially locally); do not use `--no-deps`. `E2E_WORKERS` or `--workers` controls
concurrency without changing scenarios. Multiple runners sharing one checkout still share the
standard Playwright report/history destinations; use separate checkouts for concurrent runs.

## Full-suite backlog

These are test specifications, not created tracker tickets. P1 is the next implementation batch;
P2 follows core journeys; P3 needs a separate service-enabled environment. Each row should become
one or more independent cases with its own workspace, not one serial mega-journey.

| Priority | Area | Remaining scenarios and acceptance criteria | Fixture / dependency |
|---|---|---|---|
| P1 | Sign in/out | Finish the parked logout case; wait for the completed redirect chain, then verify protected navigation requires credentials. Invalid password, expired session, refresh and deep-link return | Separate browser session per case |
| P1 | Organizations | Browser organization creation; switching organizations; persist editable fields; deactivate only the test's organization; validation and cancel paths | Organization created by the case; no shared profile edits |
| P1 | Projects | Diagnose parked rename/reload journey, then cover rename, description, auto-training toggle, switching and deactivation | Own organization/project; owner creation identity separated from concurrent creation |
| P1 | Documents | Upload txt/md/pdf/docx/xlsx fixtures; validate unsupported/oversized/empty inputs; list/filter/page; open content and metadata; edit title/sections; download and remove with confirmation; cancel removal | Small committed format fixtures; test-scoped workspace |
| P1 | Training | Finish parked Training-button test; poll job status to terminal success and verify searchable sections; retraining, failure state and repeat invocation | Background-job tier with measured multi-minute budget; mock embedding model |
| P1 | Chat and threads | Follow-up messages preserve context; reopen persisted thread; rename/delete thread; stop generation; failed turn and retry; citations/source navigation; message copy; search/filter threads; attachments persist across reload | Mock models, independent threads/documents |
| P1 | Streaming | Connect the existing isolated streaming tests to the full validation command or CI as a separate project; add real-stack stream completion, cancellation, error and persisted-answer checks | Existing mock-server tests are outside the default application suite |
| P1 | Members and roles | Keep existing owner/reader journey; add admin/editor/reader operation matrix, add/remove membership, role changes, revocation after reload and project-membership boundaries | Each case creates and assigns its own memberships; allowed counterpart for denied routes |
| P1 | Document Insights | Finish parked document/question selection; generate mock answers and verify cells after reload. Edit questions, add/remove documents, rerun, pagination and export | Small pre-split document and mock completion model |
| P2 | Task management | Rename/duplicate/delete each supported task type; list filtering/paging; nodes/edges persist; status/loading/error states | Separate task per case |
| P2 | Document digitization | Upload small fixture, configure extraction, run job, inspect/export output; invalid file and failed job | Deterministic OCR/digitization adapter needed before enabling local run |
| P2 | Agent configuration | All persisted settings, prompt validation, model selection, retrieval settings, tool validation, disabled/missing model, and feedback for failed save | Mock models/tools, no paid provider calls |
| P2 | Search | Global search opens correct project/document; semantic empty/no-match result; filters/pagination; content changed after retraining | Documents created in own workspace; stable mock vectors |
| P2 | API keys | Use a created key against an allowed endpoint, exercise its scope, revoke it and verify refusal; list/copy UI and validation | Test-owned keys; never retain key values in public notes |
| P2 | Provider keys/connectors | Create/update/remove configuration; masked values remain masked; invalid credentials and connection errors produce useful feedback | Local stub provider/connector; test-only values |
| P2 | Integrations | Configure Git/S3/API sources, run sync, update/delete source, verify imported content and failure status | Local Git/HTTP/S3-compatible fixtures; scheduler-aware budget |
| P2 | Web scraping | Add website, discover/select pages, scrape, track jobs, inspect imported content, rescrape/remove; invalid URL and controlled upstream errors | Local HTTP pages plus deterministic Firecrawl stub |
| P2 | Subscriptions/usage | Plan/usage displays; actions consume expected usage; configured-limit rejection; isolation between organizations | Abstract test plan limits; fresh organization per case |
| P2 | Profile/preferences | Profile read/edit, org/project navigation, theme, guard corrections and stale selected IDs | Dedicated editable identity; avoid mutating seeded shared profiles |
| P2 | Embedded chat | Real parent page initializes iframe, passes supported configuration, exchanges messages and displays a persisted answer; reload/reconnect | Local parent origin and own project; browser contexts isolated |
| P2 | Responsive/accessibility | Main user journeys at narrow viewport; keyboard focus, accessible dialogs/labels, error feedback and navigation | Chromium viewport project; add browser engines in nightly tier |
| P2 | Admin skills | Authorized CRUD/versioning/validation, unauthorized refusal, agent skill assignment and execution | Dedicated seeded admin identity required; no production credentials |
| P3 | Invitations | Invite, accept, expiry, revoke, duplicate email and role selection, including UI loading/error states | Local mail sink and disposable users |
| P3 | Earth Observation | OAuth guard, create/load/save scripts, editor execution, layers and layout persistence, iframe chat handoff | Dedicated GEE test account or documented adapter boundary; separate opt-in tier |
| P3 | External providers/ProvenAI | Small contract runs for enabled real integrations; provider timeout/error and callback processing | Explicit service credentials and spending budget; excluded from smoke |

DIDs, wallets and verifiable credentials are excluded following the existing handover: that area
is scheduled for removal. Never create tracker tickets or change application behavior as part of
stabilizing a test without a separate request.

## Validation

Measured against this checkout's already running ephemeral stack, with no application changes:

| Command | Workers | Result | Duration |
|---|---|---|---|
| Earlier `npm run smoke` baseline | 8 | 17 passed, 3 skipped | 17.2 s |
| `npm run smoke` after implementation | 8 | 19 passed, no skips/retries | 27.9 s |
| `npm test` after implementation | 8 | 57 passed, 4 pre-existing skips | 28.5 s |
| `npm run smoke -- --shard=1/2` | 8 | 12 passed, including four logins | 8.0 s |
| `npm run smoke -- --shard=2/2` | 7 | 11 passed, including four logins | 26.9 s |
| `npm run smoke -- --project=api -g "knowledge pipeline"` | 1 | 1 passed independently | 1.8 s |

The 19 smoke checks comprise 15 application scenarios and four fresh browser logins. These
are local measurements, not a CI or clean-stack timing claim. Early validation caught a
configuration-level grep filtering out setup and a test issuing a second reload while an
organization save was already reloading the page; both test issues were corrected. Eight
concurrent browser journeys need the normal 10-second assertion readiness waits on this stack;
shortening them to five seconds produced false failures under load. The whole-run cap remains
60 seconds. Existing unfinished logout, workspace rename, insights generation and scheduled
training journeys remain visible as full-suite skips, with the specifications above.
