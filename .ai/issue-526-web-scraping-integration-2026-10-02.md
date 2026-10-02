# Web Scraping Integration (Firecrawl) — [#526](https://github.com/ctrl-space-labs/gendox-core/issues/526)

The current plan, written 2026-10-02. **Self-contained:** it carries forward everything still true from the revisions of the 17th and the 28th of September, which it replaces, so nothing has to be read alongside it. The plan as first agreed is kept unchanged in [`issue-526-web-scraping-integration-2026-09-10.md`](issue-526-web-scraping-integration-2026-09-10.md); where the two disagree, this one holds.

**Status.** The backend is implemented and verified against a live site: the provider seam, the schema, the run, the REST surface, the entitlement and budget, page selection, and the removal of a page's content. The screen is built and agreed as a working prototype against the live API, and is not yet written into `gendox-frontend` — that is [#544](https://github.com/ctrl-space-labs/gendox-core/issues/544).

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

One forward-only migration.

**New `types` rows** — `INTEGRATION_TYPE`/`WEB_SCRAPE_INTEGRATION`, `CONNECTOR_TYPE`/`WEB_SCRAPE_FIRECRAWL`, and `WEB_SCRAPE_PAGE_STATUS`/`DISCOVERED,SCRAPED,FAILED,REMOVED` with a constants class. The codebase keeps enumerations in `types`, not Java enums.

**`gendox_core.web_scrape_pages`** — `id`, `integration_id` (FK, and the integration already carries organization and project), `url`, `title`, `is_selected`, `status_type_id`, `content_hash`, `document_instance_id`, `discovered_at` / `last_crawled_at` / `last_scraped_at`, `error_message`, audit block. `UNIQUE (integration_id, url)`, index on `(integration_id, is_selected)` and on `(integration_id, last_scraped_at)` for the monthly count.

> Two foreign keys behave differently and the difference matters to the UI: `integration_id` is `ON DELETE CASCADE`, so removing an integration removes its pages; `document_instance_id` is `ON DELETE SET NULL`, so the documents those pages produced are **not** removed with them and have to be deleted explicitly.

**`integrations` — two generic columns and one settings payload.** Deliberately not following the `directory_path` / `repository_head` precedent, where each column serves one integration type. Instead `run_interval_minutes int` (NULL means not scheduled, so every existing integration keeps today's behaviour), `last_run_at timestamp`, and `config jsonb` holding whatever a type needs — here `{ provider, crawlPageLimit }`. Nothing in the schema names this feature. The two columns stay columns because they are cross-type concepts, and because `last_run_at` is state the system writes on every run: in the payload, a finishing run and a user edit would overwrite each other. `integration.url` holds the seed URL.

**`subscription_plans` — one new column** `web_scrape_pages_monthly_limit`, seeded per sku. One column does both jobs: `> 0` **is** the entitlement, and the value **is** the monthly budget. No separate feature flag. Limits are per seat, multiplied by the plan's seat count at check time; `9999` means unlimited under the fair-usage policy.

**Monthly usage is counted from the table, not from a counter.** Scraped pages are counted from `web_scrape_pages.last_scraped_at` inside the billing period, the way websites, projects and document pages are counted from their own tables. `organization_daily_usage` is left alone: its counters are filled by an aggregation query that has caused deadlocks before, and counting from the table cannot drift.

**`allow_embed` was not added, and that is a decision, not an omission.** The 17th's plan called for it. 526.3 settled instead that a crawl source gets a row in `organization_web_sites` carrying its `integration_id`, and that everything about embeds belongs to [#527](https://github.com/ctrl-space-labs/gendox-core/issues/527). The websites list has always read as an embed allowlist while nothing enforced it; rather than display a flag no code consults, the chip was removed. See *Open questions*.

A website row holds at most one integration, so a site is either a pushing source or a crawl source, never both.

## Phase 3 — The run

`WebScrapeIntegrationUpdateService implements IntegrationUpdateService`, same shape as `ApiIntegrationUpdateService`.

`checkForUpdates(integration)`:

1. **Due check** — return empty unless the interval has elapsed, skipping entirely when `run_interval_minutes` is NULL.
2. **Entitlement check** — a downgraded organization stops crawling rather than erroring on a timer.
3. **`discoverPages`** — `provider.crawl(target)`, then upsert on `(integration_id, url)`. New URLs land `DISCOVERED` and unpicked; known URLs refresh `last_crawled_at`. **A title is written only when discovery supplies one**, because Map usually returns none and an unguarded write erases the good name the page gave while being read. A URL missing from a Map result is **not** marked `REMOVED`: Map coverage depends on the provider's index and can shrink between runs. A page becomes `REMOVED` only when its scrape reports it gone, and `REMOVED` rows are never deleted, so a URL that reappears keeps its history. URLs are **normalized before the upsert** — one trailing slash dropped, fragment cut — because Map and deep crawl report the same page differently. `last_run_at` is saved explicitly: the entity arrives detached, and without that save the integration would re-run on every poll forever.
4. **`refreshStoredPages`** — re-reads the pages that have a document. This is what the schedule follows.

**Picking lasts one run (526.10).** `is_selected` used to mean "this page belongs in the project", and the run began by deleting the documents of every page without a tick. Reading three pages therefore emptied everything else. A pick is now about the run in front of it and is cleared as each page finishes; what survives is the document. So:

- `scrapeSelectedPages` reads the picked, non-removed pages and touches nothing else.
- `refreshStoredPages` drives the schedule from the pages that have a document, which is the only durable record of what the user wanted kept.
- `removeContent(integrationId, pageId)` is the one way out: it deletes the document, clears `document_instance_id` **and `content_hash`**, unticks the page and returns it to `DISCOVERED`. Clearing the hash is what lets the page be read again — otherwise the next read fetches identical content, the hash matches, and no document is ever written.

Inside the scrape loop, per page: fetch, store the title when the page gives one, and write a document when **the content changed or the link is missing**. The second half matters because a document deleted elsewhere nulls the link through `ON DELETE SET NULL` while the hash remains; without it the page reports "unchanged" forever and never comes back. Pages are processed oldest-first, so a budget that runs out leaves the freshest pages alone. Per-page failure sets `FAILED` with the message and continues.

The service uploads each page itself through `documentService.uploadSingleFile(...)` — which stores the file, upserts the document and queues it for splitting and embedding — and returns an empty map, which the caller already reads as *no update*. `IntegrationConfiguration.integrationHandler` is not touched: stamping the document id, hash, timestamp and status happens in the update service right after its own upload.

**Deleting the source removes everything it made.** `deleteSource(integrationId)` deletes the documents first, then the integration; the pages go with it by cascade. Before this, deleting a website left its crawl source running on a schedule, fetching and billing with nothing on any screen showing it existed.

## Phase 4 — REST surface

Under `OP_EDIT_ORGANIZATION_WEB_SITES` / `OP_READ_ORGANIZATION_WEB_SITES`, matching the existing website endpoints:

| method | path | purpose |
|---|---|---|
| `GET` | `…/integrations/{integrationId}/web-scrape/pages` | paged list; filters `status`, `isSelected`, `hasContent`, free-text `search` |
| `PUT` | `…/web-scrape/pages/selection` | `{pageIds, selected}` or `{selectAll:true}` |
| `DELETE` | `…/web-scrape/pages/{pageId}/content` | take one page's content out |
| `POST` | `…/web-scrape/crawl` | discovery, `202` |
| `POST` | `…/web-scrape/deep-crawl` | link-following crawl, `202` |
| `POST` | `…/web-scrape/scrape` | read the picked pages, `202` |
| `PUT` | `…/web-scrape/schedule` | `autoCheck`, interval, provider, crawl limit |
| `GET` | `…/organizations/{organizationId}/web-scrape/budget` | the monthly allowance, what is spent, what remains |

- **Every path is nested under the organization, and each handler loads the integration through a guard that answers `404` unless it belongs to that organization.** The authority extractors resolve an organization or a project from a path; there is none for an integration id, so the tie back has to be explicit. `404` rather than `403`, which would confirm the id exists elsewhere. The same rule applies to the website endpoints and to the API keys: **every resource is resolved through the organization in the path, never by id alone.**
- **Select-all is server-side**, a single `UPDATE`. A site can hold thousands of pages. The selection flag is nullable on the wire and a body omitting it is rejected.
- **The pages list falls back to ordering by `url`** when the caller asks for no order. Postgres rewrites an updated row at the end of the heap, so without it the page a user just ticked moved, and paging could show a row twice or miss it.
- **`autoCheck: false` clears `run_interval_minutes`.** That NULL is what stops the due check, so without it the poller would keep reading and billing behind a switch the user had turned off.
- All three `POST` actions are `@Async` with `@SchedulerLock(name = "webScrapeManualTrigger-{integrationId}")`, so repeated clicks cannot fan out into repeated bills. They bypass the due check but **not** entitlement or budget, and **the checks run in the request thread while the work does not** — an `@Async` method throws after the `202` has gone out, where nothing can surface it.
- The schedule endpoint rejects intervals below a day unless the caller is a super admin.

## Phase 5 — Entitlement and budget

In `SubscriptionValidationService`, beside the other checks, all short-circuiting on `gendox.features.subscription-validation`:

- `canUseWebScrape(orgId)` → the plan's monthly page limit is above zero.
- `canScrapeWebPages(orgId, pageCount)` → pages scraped in the current billing period plus `pageCount` within the effective limit. The window comes from `BillingWindowUtils.currentBillingPeriod(plan.getStartDate(), …)`, anchored on the subscription start date rather than the calendar month.
- `getWebScrapeBudget(orgId)` → the same two figures, returned instead of discarded, with the billing window they belong to. A null limit means the budget is not being enforced, which is not a limit of zero and cannot share its representation.

The last one exists because a screen that can only learn the budget by exceeding it cannot warn anyone first, and a run that stops halfway has already been paid for the pages that did arrive. The figure is a courtesy on the way to the click; the backend still re-decides for every page.

**No allowance ratio.** An organization using the platform key spends Gendox credits, and `canSendMessage` reduces the allowance in the equivalent case. It is left out deliberately: the seeded limits are conservative and the check would add a connector lookup to every run. It can be added later without a migration.

## Phase 6 — The screen

Built and reviewed as a working prototype against the live API; still to be written into `gendox-frontend` under #544.

**Three headings, each with a count, each opening on its own.** A website is one of exactly three things and nothing useful comes from reading them mixed:

- *read by Gendox* — a crawl source. Open by default: the only group with anything to operate.
- *send content in* — a site pushing its own content with an api key.
- *only host the widget* — a name and a url, nothing behind it.

A group with no members is not drawn. **A row states what differs, once:** name, url, and one line of state. The group heading says which kind it is, so no row repeats it as a chip. **No row names WordPress or Firecrawl** — what the row describes is the direction content travels, which does not change when the tool does. The tool is named where the choice is made.

**Adding a website asks what it is for, as cards** rather than a dropdown, matching how the product asks for a task's type. Choosing *read by Gendox* reveals the page limit and the interval; choosing *widget only* asks nothing more. The third kind is not offered: a pushing site appears by itself the first time its plugin connects. Reading a site needs a project to put its documents in, so with none selected that card is not offered and the dialog says why.

**One dialog covers editing.** It opens with the bordered box the product uses to state a task's type, then name and url, then an **Advanced Settings** heading that collapses with a rotating chevron. A pushing site's url cannot be edited: the url is how the plugin is recognised, and changing it would make the next thing that site sends arrive as a second website. The provider is stated, not selected — see *Open questions*.

**The source panel.** `FIRECRAWL · every 1440 min · crawl limit n` is what the database holds, not what a person means; the schedule is said once, as a tooltip on the row's own "last read" line, instead of a sentence above the controls. Three actions carry three weights: **Find pages** outlined and free, **Search deeper** as plain text because every page it visits is billed, **Read n** filled. The remaining allowance sits over the Read button, so cost is visible before the click, and Read is disabled once nothing is left.

**Finishing is observed, not timed.** Each endpoint answers `202` and works in another thread, so the panel polls — but it stops when the work stops, not after a fixed wait. Reading clears each page's tick as it completes, so the count falling to zero is the run ending **and** doubles as real progress (`Read 3 of 7 pages`); an exhausted allowance ends it too, because the run breaks before clearing the ticks of pages it never reached. A crawl writes `last_run_at` once it has stored what it found. A wait that outlives three minutes says so rather than pretending to have finished.

**The page picker** is where the work happens:

- Rows show the path, not the whole url; every url starts with the same site, and a `www.` on one side is not a different site.
- A page's name is shown when it has one, with its path underneath. Long names wrap rather than truncate: neighbouring pages often differ only at the end.
- Status is folded into the last-read column, which carries date **and** time — most reads of a site share a date.
- Clicking a row picks it and **the tick answers the click** while the request goes. Waiting for a write and two reads read as the click not landing.
- One view selector — *all pages*, *read*, *not read yet*, or a single status — and a search box that filters on the server across url and title, so it reaches pages beyond the current table page.
- With a filter on, the header checkbox acts on the rows listed and its tooltip says so.
- A per-row control takes one page's content out, with a confirmation that says the page stays on the list.

**The word *project* does not appear.** A page is *read* or *not read yet*; taking its content out is *forgetting* it. The screen already had the verb — the button says Read, the column says Last read — and one verb for the whole screen beats a noun the user cannot place.

## What building it against real data exposed

Each of these was found by using the screen and is now fixed in the backend:

- **Deleting a website left its crawl source running**, with its schedule and its bills invisible.
- **A website was reachable by id alone.** Update and delete now resolve it through the organization in the path.
- **The pages endpoint paginated without an order**, so rows moved when one was updated.
- **Page titles were thrown away** — never stored on read, and overwritten with blank on every discovery.
- **Pages could not be searched.**
- **A page whose document was deleted elsewhere could never come back**, because the content hash still matched.

## API key removal — [#543](https://github.com/ctrl-space-labs/gendox-core/issues/543)

Found while building the key side of the same screen, and fixed with it. An API key shares its id with a `users` row, so that anything the key creates has an author in `created_by` / `updated_by`; `users` is referenced throughout the schema, so that row cannot simply be deleted. Deleting the key therefore left it orphaned — and when a website still referenced the key, the delete reached Postgres and failed there, so the caller got a constraint violation instead of an answer.

- Create, rename and revoke all resolve the key through the organization in the path, and the organization and the active flag come from the server rather than the request body.
- Revoking is refused by the application while a website still sends with the key, naming how many do.
- Removal marks the key inactive instead of deleting the row, so nothing is orphaned. Authentication already refuses inactive and out-of-window keys, so the revocation is real.
- `validateApiKey` became the one place a key offered as a credential is judged — it must exist, be active, and be inside its validity window. The path that binds a website to a key checked neither the flag nor the dates.

## Verification

**Backend verified end to end on 2026-09-22 and again on 2026-09-30**, through the API and against the dev database rather than unit tests.

- Map discovery returned a subset of a live site; a deep crawl of the same site stored roughly four times as many pages.
- A picked page produced a document with sections in the target project; a second read of the unchanged page reused the same document.
- 526.10: three pages read; reading one of them again left the other two with their original content and timestamps; one page's content removed and read again returned it; ticks cleared themselves after every run.
- `autoCheck` off left `run_interval_minutes` NULL.
- The budget endpoint returned the plan's allowance, what the organization had spent in the window, and what remained.
- Negative paths each answered as intended: an integration id from another organization, a selection body without the flag, an interval below a day from a non-admin, and a deep crawl with no configured page limit.

Still unwritten: the unit tests for the provider parsing, the update service and the entitlement checks, and the Playwright flow.

**Remaining to verify once the screen is in the product:** an organization with several dozen websites shows three short headings; a non-PRO organization sees the panel disabled with the upgrade note and the endpoints reject when the UI is bypassed.

## Open questions

- **Embed is displayed nowhere and enforced nowhere.** The websites list has always read as an allowlist, yet nothing checks it. The chip was removed rather than left implying a rule that does not exist. Enforcement belongs to #527, and the two changes to that table want to land in a known order.
- **A second provider needs two things before the UI can offer a choice.** There is no endpoint listing the providers the backend supports, so any list written into the frontend would go stale silently; and each provider needs its own connector type, or a provider could be chosen for which no credentials can be stored. Until then the provider is stated, not selected.
- **A provider key stored for a test double.** A mock adapter used for load testing appears among the model providers although it ignores any key given to it. The prototype hides providers that take no key, showing one only when a key already exists so that it can be removed. Whether such a double should be selectable at all is a product decision.
- **Whether discovery honours the target site's `robots.txt`.** A policy question for the team, not only a technical one.

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
