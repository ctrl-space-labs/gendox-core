# Web Scraping Integration (Firecrawl) — [#526](https://github.com/ctrl-space-labs/gendox-core/issues/526)

Implementation plan as of 2026-09-10, grounded in the working codebase. **Status: not started.** The ticket itself carries only Goal / Scope / Notes / Relationships — this document is the plan, and the issue body was deliberately left free of it.

## Context

[#526](https://github.com/ctrl-space-labs/gendox-core/issues/526) (P1, `roadmap-q4-26`) adds a crawl-based knowledge source to Gendox. Today content arrives through Git, S3, and API integrations; there is no way to point Gendox at a website and have it read selected pages.

Requirements as stated:

- **Firecrawl first**, with the architecture left open so Bright Data can be added later without rework.
- **Crawl and scrape run one after the other inside one integration run.** Crawl updates a DB table of available pages; scrape ingests the pages the user has already selected.
- **Frontend gets two buttons** — (i) crawl the site and bring in available pages, (ii) scrape the selected pages — plus an option to select *all* available pages.
- **Cost control by frequency.** Default once per day; a system admin can configure shorter intervals.
- **PRO accounts only.** Lower plans see the feature disabled with a note that PRO is required.

Decisions taken during planning:

- **Websites becomes one unified sources list.** Embed domains and content sources live in a single list, each row showing what it is used for (embed / content / both).
- **One target project per source**, chosen at creation. `integrations.project_id` already exists, so no new schema.
- **A changed page overwrites its document in place** and re-embeds, matching how the Git and API integrations already behave.

## What the code already gives us

Five findings from reading the codebase shape the design; each removes work the ticket assumed:

1. **A provider-pluggability idiom already exists.** [`AiModelUtils`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/utils/AiModelUtils.java) injects `List<AiModelApiAdapterService>` and resolves by `supports(name)`. Copying it means adding Bright Data later is one new `@Component` plus one `types` row.
2. **`organization_connectors` is already the right home for provider credentials** — org-scoped, JSONB `config`, `CONNECTOR_TYPE` from `types`, currently only `GOOGLE_EARTH_ENGINE`. See [`OrganizationConnector`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/model/OrganizationConnector.java), [`ConnectorTypesConstants`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/utils/constants/ConnectorTypesConstants.java).
3. **No new scheduler is needed.** `gendox.integrations.poller` (`application.yml:133`) already visits every active integration every 30 minutes. Per-integration frequency is enforced by a due-check inside the update service.
4. **The "pause between crawl and ingest" is not a new state.** The ticket flagged it as a state the integration model lacks. Given that selection is persistent table rows read on every run, both phases fit inside one `checkForUpdates` call — no suspended job, no state machine.
5. **Row presence in `organization_web_sites` does not currently express embed intent.** The table is read for URL transformation (`DocumentSplitterProcessor:125`) and joined to `integrations` + `api_keys` for the WordPress flow; the settings tooltip presents rows as an embed allowlist, but a row's purpose is implicit rather than a stored property. Hardening the embed path belongs to #527 (white-label embed), not here. The consequence for this plan: the unified list must carry an explicit `allow_embed` flag from the start, defaulting to `false` for content-only rows, so that adding a crawl source can never widen embed permissions when #527 tightens that path.

Also reusable as-is: [`ResourceMultipartFile`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/services/integrations/s3BucketIntegration/ResourceMultipartFile.java) wraps in-memory markdown for the existing upload path, and `.md` is already an accepted upload extension.

## Phase 1 — Provider seam

New package `gendoxcoreapi/services/integrations/webScrapeIntegration/`:

- `WebScrapeProvider` — `crawl(WebScrapeTarget)` returns URLs + titles only (no bodies); `scrape(WebScrapeTarget, url)` returns one page as markdown; plus `getSupportedProviderNames()` / `supports(String)`.
- `WebScrapeProviderUtils` — `@Autowired List<WebScrapeProvider>`, resolve by `supports(...)`, throw `GendoxException("WEB_SCRAPE_PROVIDER_NOT_SUPPORTED", …, BAD_REQUEST)`. Direct analogue of `AiModelUtils`.
- `FirecrawlWebScrapeProvider` — `supports("FIRECRAWL")`.
- Provider-neutral DTOs: `WebScrapeTarget{seedUrl, apiKey, crawlLimit, includePaths, excludePaths}`, `WebCrawlResult{List<DiscoveredPage>}`, `DiscoveredPage{url, title}`, `WebPageContent{url, title, markdown, contentHash, fetchedAt}`. A provider returning HTML converts inside its own adapter; the contract stays markdown.

Firecrawl calls go through a `RestClient` bean in [`RestClientConfiguration`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/configuration/RestClientConfiguration.java) (house style is `RestClient`, not `RestTemplate`):

- discovery → `POST /v1/map` — cheap URL enumeration, exactly "bring in the available pages"
- ingest → `POST /v1/scrape` with `formats: ["markdown"]`, per selected page
- `POST /v1/crawl` (async job + poll) deliberately **not** used for discovery: it fetches content we may never ingest

> Endpoint paths and request shapes above are from memory. Verify against current Firecrawl docs as the first task of this phase.

**Credentials.** Platform key from `gendox.integrations.web-scrape.firecrawl.api-key: ${FIRECRAWL_KEY:}`, following the existing `OPENAI_KEY` / `COHERE_KEY` pattern. An org may override with its own key via `organization_connectors` — add `WEB_SCRAPE_FIRECRAWL` to `ConnectorTypesConstants`. Resolution order: org connector, else platform key.

## Phase 2 — Schema

One forward-only migration, `V<YYYYMMDD>_<HHMMSS>__Add_web_scrape_integration.sql`.

**New `types` rows** — `INTEGRATION_TYPE`/`WEB_SCRAPE_INTEGRATION` (+ constant in [`IntegrationTypesConstants`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/utils/constants/IntegrationTypesConstants.java)); `CONNECTOR_TYPE`/`WEB_SCRAPE_FIRECRAWL`; `WEB_SCRAPE_PAGE_STATUS`/`DISCOVERED,SCRAPED,FAILED,REMOVED` with a `WebScrapePageStatusConstants` class — the codebase keeps enumerations in `types`, not Java enums.

**New table `gendox_core.web_scrape_pages`**

| column | notes |
|---|---|
| `id uuid` | PK, `uuid_generate_v4()` |
| `integration_id uuid not null` | FK `integrations(id)`; the integration already carries `organization_id` + `project_id` |
| `url text not null` | |
| `title varchar(1024)` | from discovery |
| `is_selected boolean not null default false` | the user's pick — survives every re-crawl |
| `status_type_id bigint not null` | FK `types(id)` |
| `content_hash varchar(64)` | SHA-256 of last ingested markdown; unchanged ⇒ skip re-embedding |
| `document_instance_id uuid` | FK `document_instance(id)`, nullable |
| `discovered_at`, `last_crawled_at`, `last_scraped_at timestamp` | |
| `error_message text` | last failure, so the UI can show why a page did not arrive |
| audit block | `created_at`, `updated_at`, `created_by`, `updated_by` |

`UNIQUE (integration_id, url)`; index on `(integration_id, is_selected)`.

**`integrations` — four new columns**, following the precedent of `directory_path` / `repository_head` living on the shared table: `web_scrape_provider varchar(64)` default `'FIRECRAWL'`, `scrape_interval_minutes int` default `1440`, `last_run_at timestamp`, `crawl_page_limit int` default `500`. `integration.url` holds the seed URL for this type.

**`subscription_plans` — one new column** `web_scrape_pages_monthly_limit int`, seeded `Free 0 / Basic 0 / Pro n / Business n`, exactly as `organization_web_sites` was added in `V20241108_174500__Create_Organization_web_site.sql`. One column does both jobs: `> 0` **is** the PRO entitlement, and the value **is** the monthly page budget. No separate feature flag.

**`organization_web_sites` — one new column** `allow_embed boolean not null default true`, backfilled `true` for every existing row so current behaviour is unchanged. New content-only sources are created with `false`. This is what makes a row's purpose explicit in the unified list; the content side needs no column, since it is already derivable from `integration_id` → `integrations.type_id`. Coordinate with #527, which also changes this table and is the ticket that will start enforcing the flag.

A website row holds at most one integration (`integration_id` is a single column), so a site is either a WordPress/API source or a crawl source, not both. The UI prevents attaching a second and offers to switch instead.

**`organization_daily_usage` — one new counter** `web_scrape_pages int`, plus the daily-usage trigger function change.

> `V20251011_102510__Update_audit_logs_to_remove_deadlocks.sql` exists because these aggregate writes have contended before. Increment this counter **once per run with the batch total**, never per page.

New/extended: `WebScrapePage` + `WebScrapePageRepository`; four new fields on `Integration`, one each on `SubscriptionPlan` and `OrganizationDailyUsage`.

## Phase 3 — The integration run

`WebScrapeIntegrationUpdateService implements IntegrationUpdateService`, same shape as [`ApiIntegrationUpdateService`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/services/integrations/ApiIntegrationUpdateService.java), `@Transactional(REQUIRES_NEW)`.

`checkForUpdates(integration)`:

1. **Due check** — return empty unless `now >= last_run_at + scrape_interval_minutes`. This is where per-integration frequency lives.
2. **Entitlement check** — `canUseWebScrape(orgId)`; if false, log and return empty, so a downgraded org stops crawling rather than erroring on a timer.
3. **Crawl phase** — `provider.crawl(target)`, then upsert on `(integration_id, url)`: new URLs land `DISCOVERED` / `is_selected = false`; known URLs refresh `title` + `last_crawled_at`; URLs absent from this crawl go to `REMOVED` but are **not deleted**, so a URL that reappears keeps its selection. Set `last_run_at = now`.
4. **Scrape phase** — load `is_selected = true AND status <> REMOVED`; trim to remaining monthly budget, oldest `last_scraped_at` first, logging what was deferred. Per page: `provider.scrape(...)`, hash the markdown, skip if unchanged, else emit an `IntegratedFileDTO` wrapping `new ResourceMultipartFile(new ByteArrayResource(md.getBytes(UTF_8)), slug(url) + ".md", "text/markdown")`. Per-page failure sets `FAILED` + `error_message` and continues.
5. Return `Map<ProjectIntegrationDTO, List<IntegratedFileDTO>>` keyed on `integration.project_id` — the single target project chosen when the source was created.

A changed page **overwrites its document in place** and re-embeds; no versioning. `content_hash` is what makes this cheap — an unchanged page never reaches the upload path at all.

**Wiring**

- [`IntegrationManager.processIntegration`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/services/integrations/IntegrationManager.java) — add a `WEB_SCRAPE_INTEGRATION` branch beside GIT / S3 / API.
- [`IntegrationConfiguration.integrationHandler`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/configuration/IntegrationConfiguration.java) — upload and splitter/training stay unchanged. Add a `WEB_SCRAPE_INTEGRATION` post-processing branch (the handler already branches on API and GIT types) to stamp `document_instance_id`, `content_hash`, `last_scraped_at`, `status = SCRAPED` from the `DocumentInstance` that `uploadService.uploadFile(...)` returns, and add the batch page count to the daily-usage counter.

Deselecting a page deletes its document via `documentService.deleteAllDocumentInstances(...)` and clears `document_instance_id` — otherwise unselecting leaves stale content in the agent's context.

## Phase 4 — REST surface

Under `OP_EDIT_ORGANIZATION_WEB_SITES` / `OP_READ_ORGANIZATION_WEB_SITES`, matching the existing website endpoints:

| method | path | purpose |
|---|---|---|
| `GET` | `…/integrations/{integrationId}/web-scrape/pages` | paged list, filter by status / selected |
| `PUT` | `…/web-scrape/pages/selection` | `{pageIds:[…], selected:bool}` **or** `{selectAll:true}` |
| `POST` | `…/web-scrape/crawl` | button (i), discovery only, `202` |
| `POST` | `…/web-scrape/scrape` | button (ii), scrape selected, `202` |
| `PUT` | `…/web-scrape/schedule` | interval, provider, crawl limit |

- **Select-all is server-side** — a single `UPDATE … WHERE integration_id = ? AND status <> REMOVED`. A site can hold thousands of pages; posting every id would be wrong.
- Both `POST` actions are `@Async` + `@SchedulerLock(name = "webScrapeManualTrigger-#{#integrationId}", …)`, mirroring `IntegrationService.triggerForOrganization`, so repeated clicks cannot fan out into repeated bills. They bypass the due check but **not** entitlement or budget.
- The schedule endpoint rejects `scrape_interval_minutes < 1440` unless `@securityUtils.isSuperAdmin()` — the idiom already used on `SubscriptionPlansController`. This is the admin override.

## Phase 5 — Entitlement and budget

In [`SubscriptionValidationService`](gendox-core-api/src/main/java/dev/ctrlspace/gendox/gendoxcoreapi/services/SubscriptionValidationService.java), beside `canCreateIntegrations` / `canCreateWebsite`:

- `canUseWebScrape(orgId)` → `plan.getWebScrapePagesMonthlyLimit() > 0`
- `canScrapeWebPages(orgId, pageCount)` → month-to-date `web_scrape_pages` + `pageCount` ≤ limit × seats

Both short-circuit on `gendox.features.subscription-validation`, as every other check in that class does.

## Phase 6 — Frontend

**Websites becomes one unified sources list.** Today [`WebsitesAdvancedOrganizationSettings.js`](gendox-frontend/src/views/pages/organization-settings/advanced-components/WebsitesAdvancedOrganizationSettings.js) is a flat list of name + URL with edit/delete, and its tooltip presents every row as an embed-allowlist entry. The WordPress/API integration attaches through `POST /websites/integration`, called by the plugin, and never surfaces here at all — so today the same table backs two invisible purposes.

The rebuild makes purpose explicit and folds crawl sources in as a third:

- Each row shows **name, URL, and a usage chip** — *Embed* (`allow_embed`), *Content* (`integration_id` set), or both — so what a website is for is readable at a glance. Existing rows render as *Embed*, matching the backfill.
- A **Content** row expands to its source panel: provider, interval, last run, and the discovered-pages table.
- Adding a website asks what it is for. Embed-only is the current one-step form. Content adds seed URL, target project, interval, and crawl limit.
- An existing embed-only row can gain a content source in place (and vice versa), since both are columns on the same row.

Files:

- `WebsitesAdvancedOrganizationSettings.js` — reworked into the unified list with usage chips and expandable rows. This is the one existing file materially rewritten; keep its create/update/delete handlers and `fetchOrganizationWebSites` dispatch pattern intact.
- `organization-websites/OrganizationWebSiteDialog.js` — extended with the purpose choice and the content-source fields.
- New `organization-websites/web-scrape/`:
  - `WebScrapeSourcePanel.js` — the expanded content panel, including the PRO gate
  - `WebScrapePagesTable.js` — discovered pages with checkboxes, a header *select all available pages*, per-row status / last-scraped / error
  - Two buttons: **Crawl site** and **Scrape selected pages** (disabled at zero selection), each with an in-flight state while the `202` job runs
- `src/gendox-sdk/webScrapeService.js` + `src/configs/apiRequest.js` entries, following `organizationWebSiteService.js` exactly — explicit `token` argument, never a global
- Redux: extend the existing `activeOrganization` website state with pages + run state rather than adding a parallel slice, since the pages hang off a website row; async thunks with loading/error states per the project's consistency rules

Because crawl sources are now created through this section, `canCreateWebsite` and `canCreateIntegrations` already cap how many a plan may have — no new count check.

**PRO gate.** `state.activeOrganization.organizationPlans` is already populated by `fetchOrganizationPlans`, so the UI reads `subscriptionPlan.webScrapePagesMonthlyLimit > 0` — no new request. When false, render the panel `disabled` with an upgrade note rather than hiding it, so the feature stays discoverable. The backend re-checks; UI state is not the control. Show remaining monthly page budget next to the scrape button, so cost is visible before the click.

## Verification

- `cd gendox-core-api && mvn test` — unit tests below.
- `mvn flyway:migrate -Durl=jdbc:postgresql://localhost:5432/gendox -Duser=admin -Dpassword=admin123`, then confirm `web_scrape_pages` exists, the four `integrations` columns are present, the plan seeding gives Free/Basic `0` and Pro/Business `> 0`, and **every pre-existing `organization_web_sites` row has `allow_embed = true`** (a row left `false` would silently drop an embed domain once #527 enforces the flag).
- New tests:
  - `FirecrawlWebScrapeProviderTest` — map/scrape response parsing, error and rate-limit paths, against recorded fixtures, not the live API.
  - `WebScrapeIntegrationUpdateServiceTest` — due check honours the interval; re-crawl preserves `is_selected`; a disappearing URL becomes `REMOVED` and keeps its selection on return; unchanged `content_hash` skips ingest; budget trims the batch.
  - `SubscriptionValidationServiceTest` — `canUseWebScrape` across four plans; `canScrapeWebPages` at and over the limit.
- End-to-end against a live Firecrawl key on a small site: add a source → **Crawl site** → page list populates → select two pages → **Scrape selected pages** → documents appear in the target project and are searchable after splitter+training → click **Scrape** again and confirm unchanged pages are skipped (check `content_hash` and the provider call count) → change one page upstream and confirm the re-scrape overwrites that document rather than creating a second one.
- Unified list: an existing embed row still shows as *Embed* and still works for the widget; a new content-only source shows as *Content* and does **not** set `allow_embed`; a row carrying both shows both chips.
- Frequency: set `scrape_interval_minutes = 1440`, run the poller twice inside 30 minutes, confirm the second pass is a no-op. Confirm a non-admin is rejected setting an interval below 1440 and a super admin is not.
- Non-PRO: switch the org to Free and confirm the panel renders disabled with the upgrade note, and that the `POST` endpoints reject directly (bypassing the UI).
- Playwright: add a source, crawl, select, scrape, and the disabled non-PRO state.

## Sequencing

Phases 1–2 land together and review independently. Phase 3 is the substance. Phases 4–5 unblock Phase 6; the frontend can build against Phase 4 stubs. Nothing here touches the AI engine or the completion path, so this runs fully parallel to the P1 agent work (#517, #518).

## Notes to carry forward

- **#527 shares `organization_web_sites`.** This plan adds `allow_embed`; #527 is the ticket that should start *enforcing* it, and the two changes to that table want to land in a known order. Worth a line on #527 once this is approved.
- **Firecrawl endpoint shapes are unverified** — `/v1/map` and `/v1/scrape` above are from memory. Confirm against current docs before writing the adapter.
- **Embed-path hardening is #527's work, not this ticket's.** This plan only makes embed intent an explicit stored flag; it deliberately does not change how the embed path validates origins. The specifics belong in the private tracker rather than in this public repo — raise them there so they are not lost.
