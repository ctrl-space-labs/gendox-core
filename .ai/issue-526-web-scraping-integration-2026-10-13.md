# Web Scraping Integration (Firecrawl) — [#526](https://github.com/ctrl-space-labs/gendox-core/issues/526)

The current plan, written 2026-10-13. **Self-contained:** it carries forward everything still true from the revision of 2026-10-02, which it replaces, so nothing has to be read alongside it. The plan as first agreed is kept unchanged in [`issue-526-web-scraping-integration-2026-09-10.md`](issue-526-web-scraping-integration-2026-09-10.md); where the two disagree, this one holds.

**Status.** The backend is implemented and verified against a live site and against a disposable database. The screen is written into `gendox-frontend` and in use. Two decisions taken since the previous revision reverse what it said, and both are described in place below: **a page's tick is durable again**, and **no interval means every pass of the poller** rather than no schedule at all.

The GitHub issues deliberately carry only Goal / Scope / Notes / Relationships. This document is the plan.

## Context

[#526](https://github.com/ctrl-space-labs/gendox-core/issues/526) (P1, `roadmap-q4-26`) adds a crawl-based knowledge source. Content already arrives through Git, S3 and API integrations; there was no way to point Gendox at a website and have it read selected pages.

- **Firecrawl first**, with the architecture left open so another provider can be added without rework.
- **Discovery and ingest run one after the other inside one integration run.** Discovery updates a table of available pages; ingest fetches the pages the user picked.
- The user chooses which pages are kept. Nothing is read without being asked for.

## What the codebase already gave us

Four findings removed work the ticket assumed:

1. **A provider-pluggability idiom exists.** `AiModelUtils` injects `List<AiModelApiAdapterService>` and resolves by `supports(name)`. Copying it makes a second provider one new `@Component` plus one `types` row.
2. **`organization_connectors` is the right home for provider credentials** — organization-scoped, JSONB `config`, `CONNECTOR_TYPE` from `types`.
3. **No new scheduler is needed.** `gendox.integrations.poller` already visits every active integration on a fixed delay. Per-integration frequency is a due-check inside the update service.
4. **The pause between discovery and ingest is not a new state.** Selection is table rows read on every run, so both phases fit inside one `checkForUpdates` call — no suspended job, no state machine.

`ResourceMultipartFile` wraps in-memory markdown for the existing upload path, and `.md` is already an accepted extension.

## Phase 1 — Provider seam

Package `gendoxcoreapi/services/integrations/webScrapeIntegration/`:

- `WebScrapeProvider` — `crawl` returns URLs and titles only from cheap discovery; `deepCrawl` returns the same shape from a link-following crawl, run only on request; `scrape` returns one page as markdown; plus `getSupportedProviderNames()` / `supports(String)`.
- `WebScrapeProviderUtils` — constructor-injected `List<WebScrapeProvider>`, resolved by `supports(...)`, raising `WEB_SCRAPE_PROVIDER_NOT_SUPPORTED`. It also resolves the API key.
- `FirecrawlWebScrapeProvider` — `supports("FIRECRAWL")`.
- Provider-neutral DTOs in `model/dtos/integrations/webScrape/`: `WebScrapeTargetDTO`, `WebCrawlResultDTO`, `DiscoveredPageDTO`, `WebPageContentDTO`. Provider-specific request/response DTOs live one level deeper under `firecrawl/request` and `/response`, mirroring the AI engine. A provider returning HTML converts inside its own adapter; the contract stays markdown. `WebCrawlResultDTO` carries `limitReached`, so a deep crawl that stopped at its limit is never read as evidence of removal.

Firecrawl calls go through a `RestClient` built from the shared `RestTemplate` bean, so the project's timeouts and tracing apply:

- discovery → `POST /v2/map`
- ingest → `POST /v2/scrape` with `formats: ["markdown"]`, per picked page
- deep discovery → `POST /v2/crawl` with `scrapeOptions.formats: ["links"]`, then poll until completed. Billed per page visited, so it runs only on request, capped by `crawlPageLimit`, with no crawl-side path filtering — filter the returned list instead. Results expire after about 24 hours.

**Credentials.** Platform key from `gendox.integrations.web-scrape.firecrawl.api-key`, backed by an environment variable like the other provider keys. An organization may override it with its own through `organization_connectors` under connector type `WEB_SCRAPE_FIRECRAWL`, config key exactly `apiKey`. Resolution order: organization connector when active and non-blank, else platform key, else `WEB_SCRAPE_API_KEY_NOT_FOUND`.

Error codes per call: `WEB_SCRAPE_MAP_FAILED`, `WEB_SCRAPE_SCRAPE_FAILED`, `WEB_SCRAPE_CRAWL_FAILED`, `WEB_SCRAPE_PAGE_FAILED` for a page returning `statusCode >= 400` or empty markdown. Non-page links are dropped by suffix. Left out deliberately: retries for `429`/`5xx`, `includePaths`/`excludePaths` filtering (the DTO fields exist and are ignored), and block-page detection in the markdown.

## Phase 2 — Schema

One forward-only migration, and a second one for the permissions (below).

**New `types` rows** — `INTEGRATION_TYPE`/`WEB_SCRAPE_INTEGRATION`, `CONNECTOR_TYPE`/`WEB_SCRAPE_FIRECRAWL`, and `WEB_SCRAPE_PAGE_STATUS`/`DISCOVERED,SCRAPED,FAILED,REMOVED` with a constants class. The codebase keeps enumerations in `types`, not Java enums.

> **A `types` row is named, never quoted by id.** The rows are inserted by migrations without explicit ids, so the same type carries a different id in every database — `GIT_INTEGRATION` is one number on a developer's machine and another in production. Any API that takes a type takes its **name**; the server resolves it. This is why `IntegrationCreateDTO` carries `type` as a string and why no client ever sends a `types` row.

**`gendox_core.web_scrape_pages`** — `id`, `integration_id` (FK, and the integration already carries organization and project), `url`, `title`, `is_selected`, `status_type_id`, `content_hash`, `document_instance_id`, `discovered_at` / `last_crawled_at` / `last_scraped_at`, `error_message`, audit block. `UNIQUE (integration_id, url)`, index on `(integration_id, is_selected)` and on `(integration_id, last_scraped_at)` for the monthly count.

> Two foreign keys behave differently and the difference matters to the UI: `integration_id` is `ON DELETE CASCADE`, so removing an integration removes its pages; `document_instance_id` is `ON DELETE SET NULL`, so the documents those pages produced are **not** removed with them and have to be deleted explicitly.

**`integrations` — two generic columns and one settings payload.** Deliberately not following the `directory_path` / `repository_head` precedent, where each column serves one integration type. Instead `run_interval_minutes int`, `last_run_at timestamp`, and `config jsonb` holding whatever a type needs — here `{ provider, crawlPageLimit }`. Nothing in the schema names this feature. The two columns stay columns because they are cross-type concepts, and because `last_run_at` is state the system writes on every run: in the payload, a finishing run and a user edit would overwrite each other. `integration.url` holds the seed URL.

> **What NULL means in `run_interval_minutes` changed, and the column comment written by the original migration is wrong.** It says NULL means the integration is not scheduled. It means the opposite: an interval is the shortest gap between two runs, **no interval means every pass of the poller**, and an integration that should never run on its own is **switched off** instead. One flag answers "should this run at all" and one column answers "how often" — before, both answers lived in the same column and a user who wanted a pause had to erase the frequency they had chosen. Correcting the comment needs a `flyway repair` on any database that has already applied the original.

**`subscription_plans` — one new column** `web_scrape_pages_monthly_limit`, seeded per sku. One column does both jobs: `> 0` **is** the entitlement, and the value **is** the monthly budget. No separate feature flag. Limits are per seat, multiplied by the plan's seat count at check time; `9999` means unlimited under the fair-usage policy.

**Monthly usage is counted from the table, not from a counter.** Scraped pages are counted from `web_scrape_pages.last_scraped_at` inside the billing period, the way websites, projects and document pages are counted from their own tables. `organization_daily_usage` is left alone: its counters are filled by an aggregation query that has caused deadlocks before, and counting from the table cannot drift.

**`allow_embed` was not added, and that is a decision, not an omission.** The 17th's plan called for it. 526.3 settled instead that a crawl source gets a row in `organization_web_sites` carrying its `integration_id`, and that everything about embeds belongs to [#527](https://github.com/ctrl-space-labs/gendox-core/issues/527). The websites list has always read as an embed allowlist while nothing enforced it; rather than display a flag no code consults, the chip was removed. See *Open questions*.

A website row holds at most one integration, so a site is either a pushing source or a crawl source, never both.

**A second migration adds two permissions.** `OP_READ_INTEGRATIONS` and `OP_EDIT_INTEGRATIONS`, granted to `ROLE_ADMIN` and `ROLE_OWNER`, inserted with `WHERE NOT EXISTS` so the migration is safe to re-run. See *Phase 4*, which explains why the integration endpoints stopped borrowing the website permissions.

## Phase 3 — The run

`WebScrapeIntegrationUpdateService implements IntegrationUpdateService`, same shape as `ApiIntegrationUpdateService`.

`checkForUpdates(integration)` does two things: **entitlement check**, so a downgraded organization stops crawling rather than erroring on a timer; then `discoverPages` followed by `syncSelectedPages`.

**The due check moved out of the service and into `IntegrationManager`**, where it applies to every type rather than to this one. The poller respects the schedule; the manual *Reload content* trigger deliberately ignores it, because a person asking for the content now is not the poller coming round, and a button that answers "not yet" does nothing a user can understand. `last_run_at` is stamped on both paths, and also by each manual web-scrape action, because *when did this last run* is the same question whoever asked.

**`discoverPages`** — `provider.crawl(target)`, then upsert on `(integration_id, url)`. New URLs land `DISCOVERED` and unpicked; known URLs refresh `last_crawled_at`. **A title is written only when discovery supplies one**, because Map usually returns none and an unguarded write erases the good name the page gave while being read. A URL missing from a Map result is **not** marked `REMOVED`: Map coverage depends on the provider's index and can shrink between runs. A page becomes `REMOVED` only when its scrape reports it gone, and `REMOVED` rows are never deleted, so a URL that reappears keeps its history. URLs are **normalized before the upsert** — one trailing slash dropped, fragment cut — because Map and deep crawl report the same page differently.

**The tick is durable, and this reverses 526.10.** The previous revision made a pick last one run: `is_selected` was cleared as each page finished, and what survived was the document. It was adopted to stop a run from emptying everything that was not ticked at that moment; it cost the screen its only statement of intent, and left the scheduled pass refreshing *whatever happened to have a document* while the button read *whatever happened to be ticked* — two sets with nothing to do with each other.

`syncSelectedPages` replaces both. The ticks are the desired state and the method reconciles the project to them, in one direction:

- a ticked page is fetched, or fetched again so its document stays current;
- an unticked page that still has a document **loses it** — `dropContent` deletes the document, clears `document_instance_id` **and `content_hash`**, and returns the page to `DISCOVERED`. Clearing the hash is what lets the page be read again later; otherwise the next read fetches identical content, the hash matches, and no document is ever written.

The scheduled pass and the Read button call this same method, because they answer the same question: *does the project match the settings?* The screen says so in as many words — the button's tooltip reads "make the project match", and with nothing ticked it warns that it will take everything back out.

Inside the scrape loop, per page: fetch, store the title when the page gives one, and write a document when **the content changed or the link is missing**. The second half matters because a document deleted elsewhere nulls the link through `ON DELETE SET NULL` while the hash remains; without it the page reports "unchanged" forever and never comes back. Pages are processed oldest-first, so a budget that runs out leaves the freshest pages alone.

**One bad page does not end the pass.** Each page is wrapped so that a `GendoxException` and any other runtime failure both mark that page `FAILED` with a message and carry on, and the page is saved in a `finally`. An exception whose message is blank — a `NullPointerException` says nothing — is recorded by its class name, because the column is read by whoever investigates. Before this, an unexpected failure on page three left pages four onward untouched and the cause only in a log.

The service uploads each page itself through `documentService.uploadSingleFile(...)` — which stores the file, upserts the document and queues it for splitting and embedding — and returns an empty map, which the caller already reads as *no update*.

**Deleting the source removes everything it made.** `deleteSource(integrationId)` deletes the documents first, then the integration; the pages go with it by cascade. Before this, deleting a website left its crawl source running on a schedule, fetching and billing with nothing on any screen showing it existed.

**Removing the integration does not remove its documents.** Deleting a source and deleting what it taught the project are two different intentions, and tying them together makes the cheap one as final as the expensive one: a source is re-added and read again in a minute, while documents take their sections, their embeddings and every answer that cited them along with them. So the documents stay, for every type. The temporary file-check rows of git and s3 are cleared first, because their foreign key is `RESTRICT` and would otherwise refuse the delete.

## Phase 4 — REST surface

**The path decides the permission.** Everything under `/organizations/{organizationId}/integrations/**` is guarded by `OP_READ_INTEGRATIONS` or `OP_EDIT_INTEGRATIONS`; what is genuinely about a website — the row, its name, its api key — keeps `OP_*_ORGANIZATION_WEB_SITES`. The previous revision had the web-scrape actions borrowing the website permissions, which was true of where they started and not of where they live.

This closed a gap the previous revision did not have an answer for: **git and s3 used to be created and changed through paths with no organization in them** — `POST /integrations`, `PUT /integrations/{id}`, `GET /integrations/{id}` — which left the guard with nothing to compare, so they were unguarded. They moved under the organization with the rest, and the old paths are gone.

| method | path | purpose |
|---|---|---|
| `GET` | `…/organizations/{organizationId}/integrations/{id}` | one integration, resolved through the organization |
| `GET` | `/integrations` | list by criteria; organization or project must be one the caller may read |
| `POST` | `…/organizations/{organizationId}/integrations` | create, naming the type |
| `PUT` | `…/integrations/{id}/active` | turn on or off |
| `PUT` | `…/integrations/{id}/schedule` | how often it runs |
| `POST` | `…/organizations/{organizationId}/integrations/trigger` | run every active integration of the organization, `202` |
| `DELETE` | `…/organizations/{organizationId}/integrations/{id}` | remove the source, keep the documents |
| `GET` | `…/integrations/{integrationId}/web-scrape/pages` | paged list; filters `status`, `isSelected`, `hasContent`, free-text `search` |
| `PUT` | `…/web-scrape/pages/selection` | `{pageIds, selected}` or `{selectAll:true}` |
| `POST` | `…/web-scrape/pages/{pageId}/content` | fetch one page now |
| `DELETE` | `…/web-scrape/pages/{pageId}/content` | take one page's content out |
| `POST` | `…/web-scrape/crawl` | discovery, `202` |
| `POST` | `…/web-scrape/deep-crawl` | link-following crawl, `202` |
| `POST` | `…/web-scrape/scrape` | reconcile the project to the ticks, `202` |
| `PUT` | `…/web-scrape/settings` | provider and crawl limit |
| `GET` | `…/organizations/{organizationId}/web-scrape/budget` | the monthly allowance, what is spent, what remains |

**Creation takes the type by name and the organization from the path.** `IntegrationCreateDTO` carries no `id`, no `organizationId`, no `lastRunAt` and no `config`: a body claiming any of them is ignored, because the field does not exist on the DTO. The name is upper-cased and checked against the four types something actually runs — web scrape, api, s3, git — so a type that exists in `types` but has no update service is refused at the door instead of becoming a row that never runs. A `projectId` is required and must belong to the organization in the path, and creating the integration turns on the project's auto training, because documents that arrive without it are stored and never embedded.

**Settings and schedule are two endpoints because they behave differently.** `config` is read-modify-write, so a body carrying only `crawlPageLimit` leaves the provider alone; `run_interval_minutes` is replaced, so an empty body clears it — and clearing it means *every pass*, which is why stopping an integration is the active flag and not an erased interval.

- **Every path is nested under the organization, and each handler loads the integration through a guard that answers `404` unless it belongs to that organization.** The authority extractors resolve an organization or a project from a path; there is none for an integration id, so the tie back has to be explicit. `404` rather than `403`, which would confirm the id exists elsewhere. The same rule applies to the website endpoints and to the API keys: **every resource is resolved through the organization in the path, never by id alone.**
- **Select-all is server-side**, a single `UPDATE`. A site can hold thousands of pages. The selection flag is nullable on the wire and a body omitting it is rejected.
- **The pages list falls back to ordering by `url`** when the caller asks for no order. Postgres rewrites an updated row at the end of the heap, so without it the page a user just ticked moved, and paging could show a row twice or miss it.
- All three `POST` actions are `@Async` with `@SchedulerLock(name = "webScrapeManualTrigger-{integrationId}")`, so repeated clicks cannot fan out into repeated bills. They bypass the due check but **not** entitlement or budget, and **the checks run in the request thread while the work does not** — an `@Async` method throws after the `202` has gone out, where nothing can surface it.
- The schedule endpoint rejects intervals below a day **for crawled sites only**; the floor is per type, and the types that cost nothing per run have none. Any type refuses an interval below one minute.

**A website and its crawl source are created together.** `POST /organizations/{id}/websites/web-scrape` makes the integration and the row in one transaction, so a crawl source appears in the same list as every other website. A domain that already has a row but no source gains one, keeping the name the user gave it; a domain that already has a source is refused, because one website has one content source and two would make the same page two documents.

**Deployment order matters.** The new code requires permissions that the second migration creates: without it, every call under `/organizations/{id}/integrations/**` answers `404` — including the *Reload content* button of every WordPress site, which posts to `…/integrations/trigger` with its api key. Flyway runs on startup in production, so the two ship together; the consequence is that the migration cannot be rolled back while the code is up.

## Phase 5 — Entitlement and budget

In `SubscriptionValidationService`, beside the other checks, all short-circuiting on `gendox.features.subscription-validation`:

- `canUseWebScrape(orgId)` → the plan's monthly page limit is above zero.
- `canScrapeWebPages(orgId, pageCount)` → pages scraped in the current billing period plus `pageCount` within the effective limit. The window comes from `BillingWindowUtils.currentBillingPeriod(plan.getStartDate(), …)`, anchored on the subscription start date rather than the calendar month.
- `getWebScrapeBudget(orgId)` → the same two figures, returned instead of discarded, with the billing window they belong to. A null limit means the budget is not being enforced, which is not a limit of zero and cannot share its representation.

The last one exists because a screen that can only learn the budget by exceeding it cannot warn anyone first, and a run that stops halfway has already been paid for the pages that did arrive. The figure is a courtesy on the way to the click; the backend still re-decides for every page.

> An organization whose plan has ended falls back to the free plan, which does not include crawling. Every web-scrape call then answers `403` — correct, and worth knowing before reading it as a regression.

**No allowance ratio.** An organization using the platform key spends Gendox credits, and `canSendMessage` reduces the allowance in the equivalent case. It is left out deliberately: the seeded limits are conservative and the check would add a connector lookup to every run. It can be added later without a migration.

## Phase 6 — The screen

Written into `gendox-frontend` under Advanced settings, and in use.

**Integrations are one list, websites are another.** A crawl source, a pushing site, an s3 queue and a git repository are the same kind of thing — something that puts content into a project — and they share one table with the columns that are true of all of them: name, type, project, status, last run. Websites keep their own panel for what is about the domain rather than the content: its name, its widget, its api key.

**A row states what differs, once.** The name comes from whatever that type actually has: the website row's name, else the queue name, else the repository url, else the first characters of the id — so every row has something to be called, including the api rows the WordPress plugin leaves behind when its website is gone. Those were filtered out before, which made the count on screen disagree with the table and left no way to remove them but a hand-written `DELETE`.

**The status column carries one control and one word.** Every type that the scheduler can pick up gets a switch; an api integration gets only the chip, because the plugin on the site sets that flag every time it connects and a switch the screen cannot keep is a promise it should not make. The same reason changes the word: a stopped crawl reads *Inactive*, a pushing site reads *Not connected*.

**Only a crawl source opens.** The row expands in place into the page picker; the list does not move and nothing navigates away.

**The source panel.** Three actions carry three weights: **Find pages** outlined and free, **Search deeper** as plain text because every page it visits is billed, **Read n** filled. The remaining allowance sits over the Read button, so cost is visible before the click, and Read is disabled once nothing is left. The schedule is said once, as a tooltip on the row's own last-run line, rather than as a sentence above the controls.

**Finishing is observed, not timed.** Each endpoint answers `202` and works in another thread, so the panel polls — but it stops when the work stops, not after a fixed wait. A wait that outlives three minutes says so rather than pretending to have finished.

**The page picker** is where the work happens:

- Rows show the path, not the whole url; every url starts with the same site, and a `www.` on one side is not a different site.
- A page's name is shown when it has one, with its path underneath. Long names wrap rather than truncate: neighbouring pages often differ only at the end.
- Status is folded into the last-read column, which carries date **and** time — most reads of a site share a date.
- Clicking a row picks it and **the tick answers the click** while the request goes. Waiting for a write and two reads read as the click not landing.
- One view selector — *all pages*, *read*, *not read yet*, or a single status — and a search box that filters on the server across url and title, so it reaches pages beyond the current table page.
- With a filter on, the header checkbox acts on the rows listed and its tooltip says so.
- A per-row control takes one page's content out, with a confirmation that says the page stays on the list.

**The word *project* does not appear.** A page is *read* or *not read yet*; taking its content out is *forgetting* it. The screen already had the verb — the button says Read, the column says Last read — and one verb for the whole screen beats a noun the user cannot place.

**Adding asks what it is for, as cards** rather than a dropdown, matching how the product asks for a task's type. Reading a site needs a project to put its documents in, so with none selected that card is not offered and the dialog says why. Git and s3 have no cards yet — [#547](https://github.com/ctrl-space-labs/gendox-core/issues/547).

## API key removal — [#543](https://github.com/ctrl-space-labs/gendox-core/issues/543)

Found while building the key side of the same screen, and fixed with it. An API key shares its id with a `users` row, so that anything the key creates has an author in `created_by` / `updated_by`; `users` is referenced throughout the schema, so that row cannot simply be deleted. Deleting the key therefore left it orphaned — and when a website still referenced the key, the delete reached Postgres and failed there, so the caller got a constraint violation instead of an answer.

- Create, rename and revoke all resolve the key through the organization in the path, and the organization and the active flag come from the server rather than the request body.
- Revoking is refused by the application while a website still sends with the key, naming how many do.
- Removal marks the key inactive instead of deleting the row, so nothing is orphaned. Authentication already refuses inactive and out-of-window keys, so the revocation is real.
- `validateApiKey` became the one place a key offered as a credential is judged — it must exist, be active, and be inside its validity window. The path that binds a website to a key checked neither the flag nor the dates.

## Verification

**Backend verified end to end on 2026-09-22, 2026-09-30, 2026-10-12 and 2026-10-13**, through the API and against a database rather than unit tests. The October runs went through a disposable stack brought up from an empty volume, so the migrations were exercised from nothing, and then through a development database with real data.

- Map discovery returned a subset of a live site; a deep crawl of the same site stored roughly four times as many pages.
- A picked page produced a document with sections in the target project; a second read of the unchanged page reused the same document.
- Unticking a page and reading again removed its document and left the other pages untouched; reading with nothing ticked emptied the project of that source's pages and left the rows on the list.
- A git integration created through the new door ran on the organization trigger, stamped `last_run_at`, and filled `repository_head` itself — the schedule and the stamp proven on a type that is not web scrape.
- An interval of five minutes was accepted on a git integration and refused on a crawled one, which is the per-type floor behaving as intended.
- A body carrying `organizationId`, `id`, `lastRunAt` and `config` had all four ignored; the row took the organization from the path and a fresh id.
- A project belonging to another organization was refused `403` while the caller was an admin of the organization in the path.
- A type that exists in `types` but has no update service was refused at the door.
- The same user, admin of two organizations, read one integration successfully under the organization that owns it and got `404` for the same id under the other.
- A reader-role user was refused on every integration endpoint and nothing changed in the database.
- The WordPress handshake, sent with an api key, created the website row and its integration and bound both; sent a second time it returned the same row without writing to it.
- Removing an integration left its documents in the project and cleared the temporary file-check rows that would otherwise have refused the delete.

Still unwritten: the unit tests for the provider parsing, the update service and the entitlement checks, and the Playwright flow. There is no automated coverage of any of this.

## Open questions

- **A type is not asked what it needs.** Creation checks that the type exists and that something runs it, never what that type requires to work: an s3 integration with no queue name and a git integration with no url are both accepted, and fail every pass afterwards with the cause only in a log. A map of type to required fields belongs beside the list of runnable types, and [#547](https://github.com/ctrl-space-labs/gendox-core/issues/547) will need it anyway, since the dialog sends exactly those fields.
- **Whether an api integration's active flag should be writable at all.** The screen hides the switch because the plugin sets the flag on every connect; the endpoint still accepts it. Hiding a control while the door stays open is a position worth taking deliberately rather than by omission.
- **A failure leaves no trace at the integration.** A pass that fails writes nothing on the integration itself, so a source that has been failing for a week looks the same as one that has nothing to do. The run is stamped when it ends, successfully or not; what is missing is the distinction.
- **Embed is displayed nowhere and enforced nowhere.** The websites list has always read as an allowlist, yet nothing checks it. The chip was removed rather than left implying a rule that does not exist. Enforcement belongs to #527, and the two changes to that table want to land in a known order.
- **A second provider needs two things before the UI can offer a choice.** There is no endpoint listing the providers the backend supports, so any list written into the frontend would go stale silently; and each provider needs its own connector type, or a provider could be chosen for which no credentials can be stored. Until then the provider is stated, not selected.
- **A provider key stored for a test double.** A mock adapter used for load testing appears among the model providers although it ignores any key given to it. The prototype hides providers that take no key, showing one only when a key already exists so that it can be removed. Whether such a double should be selectable at all is a product decision.
- **Whether discovery honours the target site's `robots.txt`.** A policy question for the team, not only a technical one.
- **The binding between a website and the key it sends with** is written from the request body on a path that is otherwise about the handshake. The requirement is that a binding changes only where a person meant to change it; the specifics belong in the private tracker rather than in this public repo.

## Notes to carry forward

- **Discovery options evaluated 2026-09-14/15.** Map returns the pages Firecrawl already knows from the sitemap and its own index; it does not follow links. On a site whose sitemap listed its pages under a different domain, Map returned 9 of 35 pages, unchanged with `ignoreCache: true` or `sitemap: "skip"`; `sitemap: "only"` returned just the seed URL. Search with a `site:` query returned the same 9 pages at twice the credits. Crawl found 32 of the 35 plus 5 unlisted markdown files at one credit per page. `formats: ["links"]` did not lower that cost. A crawl `prompt` only generates path options, and excluding listing pages also cut off every page reachable only through them, so crawl-side filtering is unsafe for discovery.
- **A completed crawl feeds Firecrawl's index**, and later Map calls return those pages — observed 2026-09-15. This is undocumented and its retention is unknown, so never treat absence from a Map result as removal.
- **A deep crawl's page list is read straight from the crawl results**, which saves a request and does not depend on that index behaviour.
- **Response parsing rules observed 2026-09-14:**
  - Map entries can lack a title and can be non-page URLs, so the title is nullable and non-page links are filtered out.
  - Scrape metadata mirrors the page's meta tags: keys vary per site and the same key can be a string on one page and an array on another. Read only `title`, `sourceURL`, `statusCode`; never deserialize it as a string map.
  - Store `sourceURL` (the requested URL), not the post-redirect `url`. **Not enough on its own:** Map and deep crawl report the same page without and with a trailing slash, which became two rows under the unique key — billed twice, and two identical documents each answering the agent separately. Discovery normalizes before the upsert.
  - A scrape call can succeed for a page that failed: treat `statusCode >= 400` as a failed page.
  - `text/markdown` pages return no title: fall back to the first heading or the file name.
  - Error bodies are `{"success": false, "error": …}`. Retry rate limits and server errors with backoff; fail fast on auth and credit failures.
  - Responses can carry a `warning` field; log it.
  - Treat known block-page bodies and empty markdown as failed pages, never as content.
- **Firecrawl serves cached scrapes.** Content-hash change detection only works if a re-scrape bounds that cache; confirm the controlling parameter before relying on re-scrape to notice an upstream edit.
- **`onlyMainContent` still leaves page chrome** — skip links, on-page tables of contents, widget text. It adds noise to embeddings and can change the content hash when nothing meaningful did.
- **Bright Data evaluated and deferred 2026-09-15.** Its Web Unlocker is the scrape equivalent, but there is no Map equivalent for arbitrary sites, its markdown kept navigation and footer and flattened tables, and failures come back as HTTP `200` with the cause in headers. An adapter would need its own discovery and content-based failure detection; revisit only for sites Firecrawl cannot fetch.
- **ShedLock composes with `@Async` as written.** The locks were briefly suspected of being inert; the `shedlock` table showed them held for real durations against the `lockAtLeastFor` floor, so `@Async` is the outer proxy and the lock works. Rows are created on first use of a lock name and reused forever; a `lock_until` in the past means free. The automatic poller takes no lock, so the table records only manual triggers.
- **Subscription limits were reworked on `dev` on 2026-09-16.** Every limit resolves through `effectiveLimit(planLimit, seats)`; `9999` means unlimited; stock-like limits are counted from their own tables while period limits come from `organization_daily_usage`; monthly windows come from `BillingWindowUtils`, anchored on the subscription start date.
- **Embed-path hardening is #527's work.** This plan does not change how the embed path validates origins; specifics belong in the private tracker rather than in this public repo.
