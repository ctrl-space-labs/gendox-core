# Application e2e coverage

Status: smoke and a first P1/P2 regression batch implemented, 2026-11-11.
The implementation table distinguishes executable coverage from remaining scenarios.
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
core browser journeys. Existing CRUD cases remain in the full suite. The four previously
unfinished browser journeys now run in the full suite, outside smoke.

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
| Browser | Document to answer | Upload, open sections, embed, send question and follow-up, expand tool call/result, verify persisted turns and reload |
| Browser | Chat sources | Independently prepare a retrieved document, open Sources, follow its link and verify the document page |
| Browser | Agent settings | Save instructions/model settings, reload, use them in chat |
| Browser | Written document | Create in editor, add section, read saved section after reload |
| Setup | Four browser logins | Runtime frontend configuration, OIDC redirects, Keycloak and profile loading |

Smoke cases also run as part of `npm test`. Setup is a project dependency and is intentionally
repeated on each shard. Use `npm run smoke -- --shard=1/2` and `--shard=2/2` on separate CI
checkouts (or sequentially locally); do not use `--no-deps`. `E2E_WORKERS` or `--workers` controls
concurrency without changing scenarios. Multiple runners sharing one checkout still share the
standard Playwright report/history destinations; use separate checkouts for concurrent runs.

## P1/P2 implementation

All new application cases use the real ephemeral API and database. Browser cases use real
pages and authentication. The mock Gemini adapter now supports required `advanced_search`
calls, structured Insights answers and stable embedding vectors. The backend executes the
real retrieval tool and jobs; mock answers do not assess answer quality or semantic relevance.
No paid LLM is called. ProvenAI remains disabled and its features are excluded.

The isolated `streaming-contract` project is included in `npm test`; it serves the built
frontend against its existing local API fixture. Its single worker is confined to that
project; smoke and workspace-scoped regression cases remain independent and parallelizable.
Browser concurrency defaults to four, under the total eight-worker limit, and is configurable
with `E2E_UI_WORKERS`. Smoke keeps its 60-second cap and no retries or skips.

| Priority | Area | Executable coverage | Remaining coverage |
|---|---|---|---|
| P1 | Authentication | Logout and protected redirect, invalid password, saved-session deep link and reload | Actual token expiry/refresh and return after fresh login |
| P1 | Organizations/projects | Browser creation, rename, address/phone, description, auto-training persistence; existing API CRUD | Switch between two workspaces, browser validation/cancel/deactivation |
| P1 | Documents | txt/md/pdf/docx/xlsx upload, parsing, metadata, original bytes, pagination, rename/removal, direct-link reload, clear upload queue | Invalid/oversized/empty files, section editing, browser removal confirmation/cancel |
| P1 | Training | Real Training button and scheduled processing | Repeat invocation, retraining and controlled job failure; assert indexed search after scheduled training |
| P1 | Chat | Browser question/follow-up, tool expansion, saved turns; API search OFF/ALWAYS, rename/delete, membership boundary; copy answer; attachment reload/download; Sources navigation assertion | Stop/retry, thread filtering and browser rename/delete |
| P1 | Streaming | Existing plain stream, client tool continuation and navigation/resume contract cases now in full suite | Real-stack stream completion, cancellation and controlled error |
| P1 | Roles | Admin/editor/reader operation matrix, membership revocation, promotion/demotion | Additional organization/project boundaries and reload via browser |
| P1 | Insights | Browser document/question selection, generated cell and reload; API edit/remove questions, duplicate nodes, run/regenerate, CSV export | Remove documents via browser, table pagination, controlled failure |
| P2 | Tasks | Four supported types create/rename/duplicate/delete; filtering/pagination assertion; browser rename/cancel deletion | Edge persistence and loading/error states |
| P2 | Digitization | Small PDF, real scheduled job using mock completion, CSV export | OCR image boundary, invalid input and controlled failure |
| P2 | Agent configuration | Existing browser settings plus persisted retrieval/generation settings and custom skill assignment/removal | Validation, disabled/missing models, controlled save failure and skill execution |
| P2 | Search | Global agent/document navigation and empty-project semantic result | Filters/pagination, changed content after retraining, relevance checks require appropriate model fixture |
| P2 | API/provider keys | API key authentication/revocation, provider key create/update/delete and masking | API key scopes/copy/validation and stubbed provider credential errors |
| P2 | Connectors/integrations | Disabled connector configuration/update/removal; Git/S3 inactive configuration/schedule/removal; website CRUD and scrape budget arithmetic | Actual Git/S3/API sync and Firecrawl jobs need deterministic local upstream fixtures |
| P2 | Subscription/usage | Active plan and available plan reads | UI usage, consumption, configured limits and organization isolation |
| P2 | Profile/navigation | Identity display, stale selected-ID correction | Profile editing with dedicated identity, theme and navigation preferences |
| P2 | Embedded chat | Real widget/iframe sends a message through the real backend and displays an answer | Cross-origin parent configuration/events, reload/reconnect persistence |
| P2 | Responsive/accessibility | Narrow viewport project/document upload dialog | Keyboard focus, labels/dialogs/error feedback across main journeys |
| P2 | Admin skills | Library/tools reads and project-specific custom skill assignment | Authorized global CRUD/versioning needs a dedicated seeded administrator |

Source metadata and task filtering currently have executable failing assertions in this
ephemeral environment. Application queries, schema and feature flags have not been changed
to make those assertions pass. Keep the failures visible; do not mark them as expected or
skip them. Recheck the environment separately before attributing them to application behavior.

### P1/P2 validation

Measured on the running ephemeral stack after rebuilding the mock adapter:

| Command | Result | Duration |
|---|---|---|
| `mvn -q -Dtest=MockGeminiServiceAdapterTest test` | 3 passed | Unit tests |
| `npm run smoke` | 19 passed, 1 failed, no skips/retries | 23.0 s |
| `npm test` | 120 passed, 3 failed, no skips/retries | 87 s |

The smoke failure is Sources metadata returning HTTP 500. The full suite includes that
browser case, the corresponding API case and a task-filtering HTTP 500 failure. Navigation
from Sources is implemented but cannot be validated past that response on this stack.
The other tests, including document parsing, attachments, embedded chat, scheduled training,
Insights, Digitization and the streaming contract, passed in the final full run.
No application source besides the mock adapter changed. The combined HTML report is left
as the latest invocation; use `npm run report`. Run history retains the failure traces and
API logs locally.

## Service-enabled backlog

These are test specifications, not created tracker tickets. Each future case must own its
workspace. P1/P2 work remaining in the table above also needs separate scenarios rather
than shared serial journeys.

| Priority | Area | Scenarios | Fixture / dependency |
|---|---|---|---|
| P3 | Invitations | Invite, accept, expiry, revoke, duplicate email and role selection, including UI loading/error states | Local mail sink and disposable users |
| P3 | Earth Observation | OAuth guard, create/load/save scripts, editor execution, layers and layout persistence, iframe chat handoff | Dedicated GEE test account or documented adapter boundary; separate opt-in tier |
| P3 | External providers | Small contract runs for enabled real integrations; provider timeout/error processing | Explicit service credentials and spending budget; excluded from smoke; ProvenAI excluded entirely |

DIDs, wallets and verifiable credentials are excluded following the existing handover: that area
is scheduled for removal. Never create tracker tickets or change application behavior as part of
stabilizing a test without a separate request.

## Initial smoke validation

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
60 seconds. The four full-suite skips in these historical results have since been replaced
by executable logout, workspace creation, insights generation and scheduled training cases.
