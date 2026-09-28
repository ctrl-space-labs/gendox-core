# Web Scraping Integration (Firecrawl) — #526, frontend revision

Revision of the frontend phase, written 2026-09-28 after the settings screen was built as a working prototype against the live API and reviewed screen by screen.

The plan as first written is kept unchanged in [`issue-526-web-scraping-integration-2026-09-10.md`](issue-526-web-scraping-integration-2026-09-10.md), and the revision it became in [`issue-526-web-scraping-integration-2026-09-17.md`](issue-526-web-scraping-integration-2026-09-17.md). **This file supersedes Phase 6 of the 17th only.** Everything else in that file — the provider seam, the schema, the run, the entitlement, and the verification already done — still holds.

**Status: the UI below is built and working, but only in the prototype.** `gendox-frontend` still shows the old flat websites list. This file describes what the product screen should become, so that it can be agreed before it is written. How the data reaches the components — Redux shape, SDK modules, thunks — is deliberately left out and will be settled once the screen itself is agreed.

## Why this revision exists

Three things Phase 6 assumed stopped being true while the backend was built:

- **`allow_embed` was not added.** 526.3 settled that a crawl source gets a row in `organization_web_sites` with its `integration_id`, and that everything about embeds and the widget is a separate decision. So the *Embed* / *Content* chips Phase 6 puts on every row have nothing to read.
- **A flat list does not survive real data.** An organization with a few dozen websites turns a flat list into a wall in which the handful of rows that can be acted on are invisible.
- **The two buttons and the page table were rebuilt.** Phase 6's *Crawl site* / *Scrape selected pages* and its plain table were tried and replaced; what follows is what the replacement settled.

## The websites list

**Three headings, each with a count, each opening on its own.** A website is one of exactly three things, and nothing useful comes from reading them mixed together:

- *read by Gendox* — a crawl source. Open by default: it is the only group with anything to operate.
- *send content in* — a site that pushes its own content with an api key.
- *only host the widget* — a name and a url, nothing behind it.

A group that has no members is not drawn at all.

**A row states what differs, once.** Name, url, and one line of state: when a source was last read, which key a pushing site sends with, or that nothing is read from it. The group heading already says which kind it is, so no row repeats it as a chip.

**No row names WordPress or Firecrawl.** Today a pushing site is the WordPress plugin and a read site is crawled by Firecrawl, but what the row describes is the direction content travels, and that does not change when the tool does. The tool is named where the choice is made — in the add dialog — not thirty times down a list.

**Only a crawl source expands.** Its panel is described below.

**Every row ends with edit and delete, always visible.** A pushing row also carries a reveal and a copy for its key, next to the key itself. A website whose name was never set to anything but its url shows the url once, not twice.

## Adding a website

**The first question is what the website is for, asked as cards** rather than a dropdown, matching how the product already asks for a task's type:

- *Widget only* — the widget may run there, Gendox reads nothing from it.
- *Read by Gendox* — Gendox fetches its pages with Firecrawl on a schedule and keeps them as documents.

Choosing the second reveals the page limit and the interval; choosing the first asks nothing more. The choice is the disclosure.

**The third kind is not offered, and that is deliberate.** A site that sends its own content appears by itself the first time its plugin connects with a key. Offering it here would create a row claiming a site sends content before anything had been sent.

**Reading a site needs a project** to put its documents in, so when no project is selected that card is not offered and the dialog says why.

## Editing a website

**One dialog covers the whole source.** It opens with the same bordered box the product uses to state a task's type — here stating *Read by Gendox*, *Sends content* or *Widget only* — then the name and the url, then an **Advanced Settings** heading that collapses, carries an info tooltip and rotates its chevron, exactly as the product's task dialog does.

What sits under Advanced depends on the kind:

- a crawl source: the provider (stated, not editable), how often it is checked, how many pages discovery may look for
- a pushing site: the key it sends with, masked, with a reveal and a copy

**A pushing site's url cannot be edited.** The url is how the plugin is recognised; changing it would make the next thing that site sends arrive as a second website.

**The provider is shown but not editable.** One implementation exists, so it is not a choice. See the open questions for what a second one would need first.

**Explanations live in tooltips, not under the fields.** A dialog that explains every box in small print is longer than the thing it is asking for.

## The source panel

**One sentence instead of four fields.** `FIRECRAWL · every 1440 min · crawl limit n · last run …` is what the database holds, not what a person means:

> Firecrawl reads this site once a day, looking for up to *n* pages.

The row above already says when it last ran, so the panel does not repeat it.

**Three actions, each saying what it costs before it is clicked:**

- **Find pages** — lists what the site already exposes. Free.
- **Search deeper** — follows links to find what the first pass missed. Every page it visits is billed, and the tooltip says so.
- **Read *n* pages** — fetches the pages that are picked and keeps each as a document. Disabled with no selection, and then labelled as an instruction rather than greyed-out jargon.

Each answers `202` and works in another thread, so the panel polls the page list while a run is in flight.

## The page picker

The list of discovered pages is where the user does the actual work, and it is built around picking:

- **Rows show the path, not the whole url.** Every url on the list starts with the same site; repeating it buries the part that differs. A `www.` on one side of the comparison does not make it a different site.
- **A page's name is shown when it has one**, with its path underneath. Discovery by map usually returns no title, so the path carries the row until the page is read.
- **Long names wrap rather than truncate.** Neighbouring pages often differ only at the end, so a row you cannot read to the end is a row you cannot tell apart.
- **Status folded into the last-read column.** A date already says a page was read; only failure and disappearance from the site need a badge of their own.
- **Clicking a row picks it, and the tick answers the click** while the request goes. Waiting for a write and two reads before the box changed read as the click not landing.
- **One view selector** — all pages, only the ones I picked, or a single status — instead of a dropdown beside a separate chip.
- **A search box filters on the server**, across url and title, so it reaches pages that are not on the current table page.
- **With a filter on, the header checkbox acts on the rows listed**, not on every page of the site, and its tooltip says which. The unfiltered form still selects everything.

## What the prototype exposed, and what was fixed for it

Building the screen against real data surfaced backend gaps that are now closed:

- **Deleting a website left its crawl source running.** The integration kept its schedule and kept fetching pages with nothing on any screen showing it existed. A source created together with its row is now removed together with it — including the pages it discovered and the documents those pages produced, which nothing else would ever clean up. The UI states this before the delete, because it cannot be undone.
- **A website was reachable by id alone.** Update and delete now look the website up through the organization in the path, and an id belonging to another organization gets the same answer as an id that exists nowhere.
- **The pages endpoint paginated without an order.** Rows could move when one was updated, and paging could show a row twice or miss it. It now falls back to ordering by url when the caller asks for nothing.
- **Page titles were thrown away.** The title a page gives while being read was never stored, and each discovery pass overwrote whatever title existed with the blank the map returns. Both are fixed, so names appear and stay.
- **Pages could not be searched.** The criteria now carries a free-text term matched against url and title.

## Still to decide, before the screen is written

- **Redux and the SDK.** The pages hang off a website row, so extending the existing organization state is the likely shape rather than a parallel slice — but this is left until the screen is agreed, so the data follows the UI rather than the other way round.
- **The PRO gate**, unchanged from the 17th: the plan is already in state, so the panel renders disabled with an upgrade note rather than hidden, and the remaining monthly page budget is shown next to the read button so cost is visible before the click. The backend re-checks; UI state is not the control.
- **Which of the other settings sections follow.** The prototype reworked the whole settings card, but only the websites section is in scope here. The dialog and row-control pieces it introduced are shared, so the rest can adopt them later without a second rewrite.

## Open questions for the product owner

- **Embed is displayed but never enforced.** The websites list has always read as an allowlist, yet nothing checks it. The chip was removed rather than left implying a rule that does not exist. Enforcement belongs to #527, and the two changes to this table want to land in a known order.
- **A second scraping provider needs two things before the UI can offer a choice.** There is no endpoint listing the providers the backend supports, so any list written into the frontend would go stale silently; and each provider needs its own connector type, or a provider could be chosen for which no credentials can be stored. Until then the provider is stated, not selected.
- **A provider key stored for a test double.** A mock adapter used for load testing appears among the model providers even though it ignores any key given to it. The prototype hides providers that take no key, showing one only when a key is already stored against it so that it can be removed. Whether such a double should be selectable at all — and if so, where — is a product decision.

## Verification

The backend was verified end to end on 2026-09-22 and again while this screen was built; that record stays in the 17th's plan. For the screen itself:

- An organization with several dozen websites shows three headings and a short page, and each group opens to full rows.
- A crawl source added through the dialog appears in the sources group, expands, discovers pages, and reads the ones picked.
- A website that pushes its content shows its key on the row, reveals and copies it, and refuses to have its url edited.
- Deleting a crawl source removes its integration, its page rows and its documents, and the dialog says so first.
- Picking a page leaves the list still: no row moves, and the tick appears at once.
- Searching reaches pages beyond the current table page, and the header checkbox then acts only on what is listed.
- A non-PRO organization sees the panel disabled with the upgrade note, and the endpoints reject directly when the UI is bypassed.
