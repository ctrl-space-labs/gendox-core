# Artifacts and mini apps in the chat — [#523](https://github.com/ctrl-space-labs/gendox-core/issues/523)

The current plan, 2026-11-16, written after phase 1's backend was built. It is self-contained: it carries forward everything still true from the [plan as first written](issue-523-artifacts-2026-11-13.md), which is kept unchanged, and adds the decisions taken while building.

It covers two things the agent can put in a conversation: **artifacts** — a rendered piece of content that stands on its own, the way Claude's artifacts do — and **mini apps** — small interactive programs that live in the chat and can talk back to it.

**Status.** Phase 1 is implemented. The backend ([#568](https://github.com/ctrl-space-labs/gendox-core/issues/568)) is verified by unit tests, in the ephemeral environment, and with a real provider creating and editing an artifact from a chat. The v2 frontend ([#569](https://github.com/ctrl-space-labs/gendox-core/issues/569)) is verified in Chrome, Firefox and Safari, and on a narrow screen. Nothing of phases 2 to 6 is built.

- The frontend work is for `gendox-frontend-v2` only.
- Phase 1 is a complete, shippable feature on its own. Every later phase adds to it without changing what phase 1 stored or exposed.

The GitHub issues deliberately carry only Goal / Scope / Notes / Relationships. This document is the plan.

| Phase | Issue | Depends on |
| --- | --- | --- |
| 1 — backend | [#568](https://github.com/ctrl-space-labs/gendox-core/issues/568) | — |
| 1 — frontend (v2) | [#569](https://github.com/ctrl-space-labs/gendox-core/issues/569) | #568 |
| 2 — richer artifacts, sharing in the organization, the Artifacts page | [#570](https://github.com/ctrl-space-labs/gendox-core/issues/570) | #568, #569 |
| 3 — mini apps that talk to the chat | [#571](https://github.com/ctrl-space-labs/gendox-core/issues/571) | #569 |
| 4 — state, and apps that call the agent | [#572](https://github.com/ctrl-space-labs/gendox-core/issues/572) | #571 |
| 5 — a separate origin, public links | [#573](https://github.com/ctrl-space-labs/gendox-core/issues/573) | #570 |
| 6 — watching it being written | [#574](https://github.com/ctrl-space-labs/gendox-core/issues/574) | #569 |

## What changed from the first plan

- **The kind is a type.** `artifacts.artifact_type_id` references `gendox_core.types` (category `ARTIFACT_TYPE`: `HTML`, `SVG`, `MARKDOWN`, `CODE`), as tasks, connectors and geometries do. A new kind is a new row, with no change to the table. The tools still speak lower case (`kind: "html"`).
- **`language` is `code_language`**, in the table, the entity, the DTOs and the tool.
- **Plan gating is a column, not a named feature.** `subscription_plans.artifacts_enabled`, default `true`, read by `SubscriptionValidationService.canUseArtifacts`, the way web scraping is read from its monthly page limit. The backend has no list of named features to put `ARTIFACTS` in.
- **A cut call needed the converters too.** Two providers did not report the output limit as `length`; both now do (see *Output tokens*).
- **Public threads are not open to anonymous readers in phase 1** (see *REST surface*).

## Context

The ticket asks that the agent can "produce small rendered UI, not just text": info cards, data and reporting views, HTML/CSS/JS shown inline or in a side window. The scope agreed on the ticket for v2:

- a side panel beside the chat, and a compact card inline in the message that created the artifact;
- the artifact renders in a sandboxed frame with no access to the page, the session or the API — anything it needs is passed in when it is created;
- each change is a new version of the same artifact; the panel shows the latest, with earlier versions one click away;
- the same artifacts work in the embedded widget, and the side panel becomes full-screen on narrow screens.

Two words are used throughout:

- **Artifact** — content that is substantial, self-contained and worth keeping or changing: a report, a card, a diagram, a page, a piece of code. It has a title, a type and versions.
- **Mini app** — an artifact of type `html` that is interactive. A calculator, a quiz, a filterable table are mini apps that need nothing from outside and work from phase 1. A mini app that wants to *reach out* — put text in the composer, tell the agent what the user picked, keep state, call a tool — does so through a bridge the host controls, which arrives in phases 3 and 4.

They are one thing at two levels of capability, on one runtime. That runtime is also what [#522](https://github.com/ctrl-space-labs/gendox-core/issues/522) (code execution in the browser) and [#525](https://github.com/ctrl-space-labs/gendox-core/issues/525) (the multi-window workspace) need: a pane that shows model-authored code in isolation. [#517](https://github.com/ctrl-space-labs/gendox-core/issues/517) (Agent Skills, done) is how an agent gets the ability; [#521](https://github.com/ctrl-space-labs/gendox-core/issues/521) (chat on every page) inherits the panel.

## What the codebase gave us

1. **A tool can exist as code alone and reach an agent through a skill.** A `DefinedToolHandler` bean carries its own JSON definition and needs no `ai_tools` row. A skill's `allowed-tools` brings it into the turn through `CompletionRuntimeContextResolver.withSkillTools`. Shipped skills are folders under `gendox-core-api/src/main/resources/skills/`, imported at startup by `SystemSkillImporter`.
2. **The handler knows which message it belongs to.** `ToolExecutionContext.parentMessage` is the assistant message that carries the tool call, already saved and with an id, thread and project. A version points at it.
3. **A handler's error goes back to the model, not to the user.** `AiToolRegistry.execute` turns a `GendoxException` into a tool result with the error code, the message and the expected schema. Validation is exceptions with messages that say what to do next.
4. **Tool calls are stored with their message and replayed.** `message.tool_calls` is JSONB and the next turn replays recent messages, so an artifact's content written as a tool argument is stored twice and re-sent on later turns — the reason updates are edits, and the reason for the stubbing in phase 2.
5. **The stream already delivers both halves.** Over SSE a `message` event carries the saved assistant message with its tool calls, and another carries each tool result. The card appears from the first and learns the id and version from the second, with no new event type.
6. **The stream cannot show an artifact while it is being written.** Deltas carry only answer and reasoning text. Live writing needs a new delta kind — phase 6.
7. **Thread access is already expressed.** Reading a thread's messages is allowed to a member of the thread with read rights, or, for a public thread (the conversation an anonymous visitor starts with a public agent), to anyone — but only for the paths the security configuration lets through without a login.
8. **A completion that ran out of output tokens inside a tool call ended without a word.** The loop continued only on `tool_calls`, and the default output limit (`gendox.agents.max_token`) is sized for chat answers. Fixed in phase 1 for every tool (see *Output tokens*).
9. **v2 already has the three places an artifact opens.** The chat's sheet (the one Sources uses, with a wide variant), a dock tab routed by URL (`DOCK_ONLY` and `NEAR` in the agent home page, `DockSources` as the model), and the embedded chat page inside the widget frame. `Chat` already takes a `prefill`, and the dock already has `actions.ask(text)`.
10. **The answer already groups tool calls.** `buildTurns` yields the tool calls of a turn with their results matched by `toolCallId`, and `ChatTurn` already pulls `read_skill` calls out into their own line. An artifact card is a third group in the same place.
11. **The sandbox shell pattern is in the repo.** The Earth Observation workspace loads a static page from `public/` in a sandboxed frame; the page owns its Content Security Policy in a `<meta>` tag and talks to the host by handshake and `postMessage`.
12. **The styles exist.** `base.css` already has the classes for an artifact card, its inline frame, the full view, its toolbar and its footer note, brought over from the prototype.
13. **v2 is a static export served as plain files.** A policy sent as a response header, or a second hostname for the frame, is a deployment change and not only code — the reason the stronger isolation is its own phase.
14. **Plan limits live on `subscription_plans`**, one column per limit, read by `SubscriptionValidationService`; `planFeatures.js` in v2 only drives what the UI offers.

## Prior art, and what we take from each

| Source | What it does | What we take |
| --- | --- | --- |
| Claude artifacts (help center) | Content that is "significant and self-contained", opens in its own window beside the conversation; view code, copy, download; later: artifacts that call the model, with per-artifact storage and first-use consent | The definition of when something deserves an artifact; the panel's actions; the order in which capabilities arrive, each behind consent |
| Claude 3.5 artifacts prompt (third-party copy, not verified as current) | Good artifacts are substantial, reusable, stand alone; "when unsure, don't"; one per message; a stable identifier reused for updates | The guidance text of our skill; identity that survives updates |
| ChatGPT canvas (third-party copy) | `create_textdoc`, and `update_textdoc` with pattern/replacement instead of a rewrite | Targeted updates as the normal way to change an artifact |
| Open WebUI | Sandboxed `srcdoc` frame, scripts on and same-origin off by default, a policy prepended as a meta tag, a version selector | Confirms the defaults; the version selector |
| LibreChat | Types for html, react, svg, mermaid, markdown; a per-agent artifact mode; a fixed list of importable libraries | Types as a closed list; libraries as a fixed, shipped set |
| MCP Apps (SEP-1865, final) | A standard for UI that a tool returns: JSON-RPC over `postMessage`, an initialize handshake, host context (theme, tokens, display mode, size), display modes, `ui/message`, `ui/update-model-context`, `ui/open-link`, size notifications; a restrictive default policy and a requirement that host and frame have different origins | **The bridge vocabulary, adopted as is**, so the same frame can later host real MCP Apps |
| OpenAI Apps SDK | State in three kinds: business data owned by the server, UI state per rendered instance (part visible to the model, part private), cross-session state in storage the server controls | The state model of phase 4 |
| "Browser sandbox for agent-generated HTML" (agentpatterns.ai) and S. Willison's tests (2026) | Three layers: a sandbox without same-origin, a policy the content cannot remove, a typed message channel validated by the parent. A meta policy survives tag removal and document replacement in a script-only sandbox | The three layers, and the confidence to start with a meta policy |
| web.dev "Securely hosting user data" | A separate sandbox domain, a static shim that renders what it is sent, one site per piece of content | The target of phase 5 |

Glance (plivo-labs) and Postplan were also looked at: Glance confirms "untrusted HTML from a separate origin, a new version per review"; Postplan had nothing for this.

## Decisions

### One runtime, two levels

Everything model-authored that can execute — `html` and `svg` — renders in **one frame component**, used by the inline preview, the sheet, the dock tab and the widget. What a given artifact may do beyond rendering is a list of capabilities, empty in phase 1. Nothing is designed twice for "artifacts" and "apps", and #522 and #525 get the same component.

### The tools — built

Three handlers in `ai/engine/tools/artifacts/`, shaped like `ReadSkillTool`, with `ArtifactToolSupport` for what they share (the calling message, and the thread it names).

- **`create_artifact`** — `title`, `kind` (`html`, `svg`, `markdown`, `code`), `content`, and `code_language` when the kind is `code`. Creates the artifact and its version 1. Returns `{ artifactId, version, title, kind }` — never the content, which the model has just written.
- **`update_artifact`** — `artifact_id`, and either `edits` (a list of `{ old_text, new_text }`, applied in order, each `old_text` occurring exactly once in the text it is applied to) or `content` (a full rewrite); optionally a new `title`. A title alone renames without a new version. Returns `{ artifactId, version, title }`.
- **`read_artifact`** — `artifact_id`, optionally `version`. Returns the content with `version` and `latestVersion`, so the model sees when it read an older one. It exists because the creating call can scroll out of the replayed history, and a failed edit needs the real text.

`artifact_id` is typed as a UUID in the arguments: a malformed one fails in argument reading, which already answers the model with the schema.

Errors returned to the model, each saying what to do next:

| code | when |
| --- | --- |
| `ARTIFACT_EDIT_NOT_FOUND` / `ARTIFACT_EDIT_NOT_UNIQUE` | an `old_text` missing, or found more than once; names the edit and suggests `read_artifact`. No edit is applied |
| `ARTIFACT_EDIT_INVALID` | an empty `old_text` |
| `ARTIFACT_NOT_FOUND` | an `artifact_id` not in this thread; lists the thread's artifacts by id and title |
| `ARTIFACT_VERSION_NOT_FOUND` | a version that does not exist; gives the range |
| `ARTIFACT_TYPE_NOT_SUPPORTED` | a kind outside `ARTIFACT_TYPE`; lists the ones there are |
| `ARTIFACT_CONTENT_TOO_LONG` | content over `gendox.artifacts.max-content-length` |
| `ARTIFACT_UPDATE_AMBIGUOUS` / `ARTIFACT_UPDATE_EMPTY` | both `edits` and `content`, or nothing to change |
| `ARTIFACTS_NEED_A_THREAD` | a call with no thread to belong to |

**Identity is the server's id, not a name the model invents.** The id comes back in the tool result, which is in the history the model sees.

**The tools reach only the calling message's thread.** There is no user permission check inside them: they cannot touch anything outside the conversation the agent is already in.

**Types and their renderers:**

| type | rendered by | phase |
| --- | --- | --- |
| `HTML` | the frame | 1 |
| `SVG` | the frame (an SVG can carry script, so it is never put in the page) | 1 |
| `MARKDOWN` | the chat's own `Markdown` component, with the sanitizing it already applies to answers | 1 |
| `CODE` | a highlighted block with `code_language` | 1 |
| `MERMAID` | the frame, with the library shipped in the shell | 2 |

A new type is a `types` row in a migration and a value in `create_artifact`'s `enum`; `ArtifactService` needs no change. `code_language` is kept for `CODE` only.

### The skill — built

`resources/skills/artifacts/SKILL.md`, `allowed-tools: create_artifact, update_artifact, read_artifact`. An agent gets artifacts when an admin adds the skill from the library on the agent's Skills screen; nothing else is configured. The tools are offered through the skill only, since the skill is where the guidance on *when* lives. Its text says, in substance:

- make an artifact for content that is substantial, stands on its own, and that the user is likely to keep, reuse or ask to change; otherwise answer in the chat. When unsure, don't. One per message unless asked;
- self-contained: one file, no network, no images, fonts or scripts from the web, no storage;
- follow the theme through CSS variables, each with a fallback: `--color-background-primary`, `--color-background-secondary`, `--color-text-primary`, `--color-text-secondary`, `--color-border-primary`, `--color-accent`, `--font-sans`, `--font-mono`;
- compact: a cut call is lost, so build a large one in steps;
- change with edits; read the artifact again when an edit fails; update the same artifact rather than making a new one per change;
- cite the documents behind the content; after the call, say in a sentence what was made, without repeating it.

**The variable names are a contract with the frame** (#569): the frame must define exactly these.

The prototype's task-shaped skills (*Info card*, *Report with a chart*) come in phase 2 as further library skills that allow the same tools.

### Storage — built

One idempotent migration, `V20261113_123000__Add_artifacts.sql`:

- the four `ARTIFACT_TYPE` rows in `gendox_core.types`;
- **`artifacts`** — `id`, `thread_id` (cascade), `project_id` (cascade), `title`, `artifact_type_id` (references `types`), `code_language`, `latest_version`, and the audit columns; indexed on `thread_id`;
- **`artifact_versions`** — `id`, `artifact_id` (cascade), `version`, `content` (text), `message_id` (set null if the message goes), `created_at`, `created_by`; unique on `(artifact_id, version)`, indexed on `artifact_id`;
- `subscription_plans.artifacts_enabled`, boolean, default `true`.

**First-class tables rather than reading artifacts out of `message.tool_calls`**: an edit has no full content in its message, a thread's list would mean scanning every message, and phases 4 and 5 need a row to hang state and sharing on.

**`latest_version` is the number, not a reference to the version row.** A reference would be circular with `artifact_versions.artifact_id` (a nullable column or a deferrable constraint, neither used elsewhere), and the number is what the model, the API and the UI speak of and what the next version is counted from. The unique `(artifact_id, version)` index makes reading the latest one lookup. Only `ArtifactService` raises it, in the transaction that adds the version.

**A version never changes.** The entity marks every column `updatable = false`; a version has no update audit columns.

**Versions are numbered under a row lock.** `ArtifactRepository.lockByIdAndThreadId` takes the artifact `PESSIMISTIC_WRITE`, as `CompletionTurnRepository` does, so two updates of one artifact in the same answer are numbered one after the other; the unique index is the backstop.

**The version list never loads content.** `ArtifactVersionRepository.findSummariesByArtifactId` selects number, message and date into `ArtifactVersionSummaryDTO`.

### REST surface — built

`ArtifactController`, read-only, nested under the thread. Every lookup includes the thread, so an artifact of another thread is `404`. Responses are DTOs (`ArtifactSummaryDTO`, `ArtifactDTO`), with the type as the `Type` object, as other DTOs show types.

| method | path | returns |
| --- | --- | --- |
| `GET` | `…/threads/{threadId}/artifacts` | the thread's artifacts, oldest first, without content |
| `GET` | `…/threads/{threadId}/artifacts/{artifactId}` | the artifact, its versions (number, message, date), and the latest content |
| `GET` | `…/threads/{threadId}/artifacts/{artifactId}/versions/{version}` | the same, with that version's content |

There is no write endpoint in phase 1: artifacts are made by the agent, and a user's change goes through the chat.

**Public threads are not open to anonymous readers in phase 1.** The handlers carry the same guard as the thread's messages, including public threads, but the paths are not among those the security configuration lets through without a login, so an anonymous visitor cannot read them yet. Whether they open — and whether the agent offers the tools in a visitor's conversation at all — is decided with the widget work. Until then a public agent should not be given the skill. When the paths do open, they are named one by one for `GET`, never with a wildcard, so that a later endpoint under them stays closed until it is named.

### Output tokens, and a call that is cut short — built

- **A floor.** When `create_artifact` or `update_artifact` is among a turn's tools, `CompletionRuntimeContextResolver.withArtifactOutputFloor` raises the output limit to at least `gendox.artifacts.min-output-tokens` (default 16000). A higher limit of the agent stays. `read_artifact` alone does not raise it: its text is input. The floor is computed after the plan check, from the tools that remain.
- **A cut call is answered, not dropped.** When a completion ends with `length` and carries tool calls, `ToolExecutionService.cutShort` gives each call an error result (`TOOL_CALL_CUT_SHORT`: the output ran out; write smaller or build in steps), none of them runs, and the loop goes on, bounded by the iteration limit as always. Every stored tool call is then followed by its result, which the providers require of the next request. This applies to every tool.
- **Every provider reports the limit as `length`.** The Anthropic converter maps `max_tokens` to `length`. The OpenAI Responses converter checks `incomplete` before tool calls — an incomplete response's last call may end halfway and must not run — and maps it to `length`, or `content_filter` when that is the reason.

### Plan gating — built

`CompletionRuntimeContextResolver.withArtifactToolsIfPlanAllows` removes all three artifact tools when the organization's plan has `artifacts_enabled` false, so the agent cannot write one even with the skill, and the floor is not raised. The plan is read only when an artifact tool is offered. When subscription validation is off (local and ephemeral environments), artifacts are always allowed. Which plans include artifacts is changed with an `UPDATE` in a migration; the decision is made outside this document.

In v2, what the UI offers follows the same column, read from the organization's plan, rather than a list of excluded plans.

### The frame — #569

Three layers, each independent of the others:

1. **A sandbox without same-origin.** The frame is `sandbox="allow-scripts"` and nothing else: its origin is opaque, so it has no cookies, no storage, and no way to read the page that holds it. No top navigation, no popups, no downloads, no forms.
2. **A policy the content cannot change.** The frame loads a static shell page, `public/artifact-sandbox/`, whose first element is a `<meta>` Content Security Policy: `default-src 'none'`, inline script and style only, images from `data:` and `blob:` only. No network of any kind. The shell renders the artifact in an inner frame that inherits the policy, and stays in place as the relay for messages.
3. **A typed channel.** The host accepts messages only from the frame it created (`event.source`), only of the methods it lists, and validates each one's shape. Because an opaque origin cannot be named as a target, **the host never sends the frame anything secret**.

**A shell page rather than `srcdoc` built by the host**: the policy and the bridge live in one file that the host cannot get wrong at a call site, the widget and the app share it, and phase 5 moves that one URL to its own origin without touching the callers.

Design requirements that follow from what a policy does not govern (navigation, and some browser features outside its reach):

- **The frame receives the artifact's content, the theme and its size — nothing else.** No token, no ids beyond its own, no user details.
- **Links and downloads go through the host**, which shows the destination and opens it itself.
- The channels a policy does not cover are part of verification, in every supported browser, before phase 1 ships.

**Theme and size.** On initialize the host sends the theme and the variables the skill names, mapped from v2's own and sent again on a theme change:

| frame variable | v2 token |
| --- | --- |
| `--color-background-primary` | `--surface` |
| `--color-background-secondary` | `--surface-2` |
| `--color-text-primary` | `--text` |
| `--color-text-secondary` | `--text-2` |
| `--color-border-primary` | `--border-2` |
| `--color-accent` | `--accent-text` |
| `--font-sans` / `--font-mono` | `--font` / `--font-mono` |

The frame reports its content height, so the inline preview fits its content up to a maximum instead of a fixed box.

### The bridge

JSON-RPC 2.0 over `postMessage`, **with the method names of MCP Apps**.

| phase | methods | what the host does |
| --- | --- | --- |
| 1 | `ui/initialize`, `ui/notifications/initialized`, `ui/notifications/host-context-changed`, `ui/notifications/size-changed`, `ui/open-link`, `ui/download-file` | handshake, theme, height; opens a link or saves a file after showing the user what it is |
| 3 | `ui/message`, `ui/update-model-context`, `ui/request-display-mode` | puts text in the composer; attaches a note to the user's next message; switches between inline and the panel |
| 4 | state get/set (a Gendox extension), `tools/call`, `sampling/createMessage` | durable state; a tool of the agent; a question to the agent |

Rules for every capability beyond phase 1:

- **Off unless declared.** `create_artifact` gains an optional `capabilities` list; the panel shows what an app may do.
- **The user stays the sender.** `ui/message` fills the composer and the user presses send. Nothing an app does becomes a message, a tool call or spent tokens without the user's action or a consent they gave to that app.
- **What comes out of the frame is untrusted input**, to the host and to the model: length-limited, and shown to the model marked as coming from the app, never as the user's words.

### Where it shows — #569

- **In the answer** — a card where the tool call is: title, type, version, *Open*. The creating message already holds the content in its tool call, so the card of a `create_artifact` shows a live preview **with no request**. The card of an update is compact — *Updated · v3* — and loads nothing until opened. No request per card, ever. A version's `messageId` is the assistant message that carries its call, which places the card.
- **The panel** — the chat's sheet, wide; full-screen on narrow screens and in the widget. *Preview* and *Code* tabs, a version selector (latest by default), copy, download, and *Ask for a change*, which prefills the composer. The footer says who made it and that it runs sealed.
- **A dock tab** — `/artifact?threadId=&artifactId=`, dock-only, opening beside sources and documents. One tab per artifact; a new version refreshes the tab that is open.
- **The widget** — the same card and the same panel inside the embedded chat, once public threads are opened (see *REST surface*).

A new version arriving while the panel is open moves it to the latest, unless the user is looking at an older one on purpose.

## Phase 1 — Artifacts

**Backend — done ([#568](https://github.com/ctrl-space-labs/gendox-core/issues/568))**

- Migration: the types, `artifacts`, `artifact_versions`, `subscription_plans.artifacts_enabled`.
- `Artifact`, `ArtifactVersion`, their repositories, `ArtifactService`, four DTOs, `ArtifactConverter`, `TypeService.getArtifactTypes`.
- The three handlers and the `artifacts` skill.
- `ArtifactController` with the three read endpoints.
- The output floor, the plan check, the cut-call answer and the two converters.
- Configuration: `gendox.artifacts.max-content-length` (default 200000 characters) and `gendox.artifacts.min-output-tokens` (default 16000).

**Frontend (v2) — done ([#569](https://github.com/ctrl-space-labs/gendox-core/issues/569))**

- `public/artifact-sandbox/`: the shell with its policy, the inner frame, the relay.
- `ArtifactFrame` (the one component), with the phase-1 bridge and the variables above.
- `artifactService.js` in the SDK and the store entries for a thread's artifacts — loaded when a panel or tab opens, not with the conversation.
- The card in `ChatTurn`, the panel in `Chat` (`onOpenArtifact`, beside `onOpenSources`), `DockArtifact` and its route, the widget's full-frame panel.
- Renderers for `MARKDOWN` and `CODE` outside the frame.
- A failed artifact call, a cut one included, shows on its card as a warning in plain words, with the code.

As built: `components/artifacts/` holds `ArtifactFrame`, `ArtifactContent`, `ArtifactCard`, `ArtifactView` and `artifactUtils`; the view loads with the SDK when it opens, with local state as the Sources tab does, and moves to a newer version when the conversation knows of one. In the agent home's dock the tab has no *Ask for a change*: it cannot reach the chat's composer.

**Done when** an agent with the skill, asked for a summary card of a document, produces a card in the answer; it opens in the panel and as a dock tab; "make the title shorter" produces version 2 by an edit; version 1 is one click away; and an artifact too long for the output limit ends in a visible, explained failure rather than silence. The widget on a public thread follows when public threads are opened.

## Phase 2 — Richer artifacts

- **Libraries, shipped with the shell** — a chart library and Mermaid, as files under the shell's folder, a fixed list named in the skill. Never a CDN: an allowed outside origin is a way out of the frame.
- `MERMAID` as a type; the task-shaped skills *Info card* and *Report with a chart*.
- **Old content leaves the replayed history.** When history is rebuilt for the model, the `content` argument of earlier `create_artifact` / `update_artifact` calls is replaced by a short fixed note naming the artifact and version — fixed, so that prompt caching still holds. The model reads the current text with `read_artifact` when it needs it.
- A list of the thread's artifacts in the chat header, once a thread has more than one.
- *Try to fix*: an error raised inside the frame is offered to the user as a prefilled message.
- **Sharing inside the organization.** The owner of the thread shares one artifact with the signed-in members of the organization: a share record (the artifact, the version or "latest", who shared it, when it ends, revoked or not), an endpoint to create and revoke it, and a page that shows the artifact in the same sealed frame. The reader is a known user, so this does not wait for the separate origin.
- Write endpoints, if any arrive here (editing by hand, sharing), require a signed-in user and are never let through the security configuration without a login.
- **An Artifacts page for each agent**, beside Tasks and Knowledge in the agent's menu, as a page and as a dock tab. It lists the artifacts of the conversations the user can open with this agent — never every artifact of the agent: a conversation is personal, and its artifacts are shown to others only by sharing. With sharing, a second section lists what was shared with the user.
  - Backend: `GET …/organizations/{organizationId}/projects/{projectId}/artifacts`, without content, paged, newest change first, searchable by title and filtered by type. It returns the artifacts of the threads the user is a member of, filtering rather than refusing, so one thread out of reach never empties the list.
  - Frontend: a row per artifact with its type, title, version, date and the conversation it came from. A click opens it in `ArtifactView` (the panel, or the artifact tab); a second action opens the conversation.

## Phase 3 — Mini apps that talk to the chat

- `capabilities` on `create_artifact`, stored on the artifact, shown in the panel.
- `ui/message` — the app proposes a message; it lands in the composer.
- `ui/update-model-context` — the app states what the user has selected or entered; the latest statement travels with the user's next message, marked as coming from the app. Each statement replaces the previous one.
- `ui/request-display-mode` — inline or panel.
- UI state per rendered instance, kept by the host for the life of the page.
- Skill guidance for apps: what to declare, and to work without the bridge when a capability is refused.

## Phase 4 — State, and apps that call the agent

- **Durable state**, following the three-kinds model: stored on the server per artifact, per user by default and shared by declaration, text only, size-limited, asked for the first time an app uses the shared kind. Never `localStorage`: the frame has none, by design.
- **`tools/call`** — an app runs a tool of its agent through the host. Limited to the tools the agent already has, read-only tools first, behind a consent given once per app.
- **`sampling/createMessage`** — an app asks its agent a question. It spends the organization's usage, so it is counted like any completion and asked for on first use.

Each of these opens a path from model-written code to something that costs or acts. None of them ships without its own review.

## Phase 5 — A separate origin, and the shared runtime

- The shell moves to **its own hostname**, with the policy as a response header (which can also say who may frame it) and a distinct origin per artifact.
- `ArtifactFrame` becomes the pane runtime of #522 and #525: code execution is the same frame with a different capability list; a window is the same frame as a tab.
- Hosting MCP Apps returned by an agent's MCP tools, on the same bridge.
- **A public link** — anyone holding the link opens the artifact, with no account. It reuses the share record of phase 2 and waits for the separate hostname: model-written HTML shown to the public must not be served under the application's own name. A copy to keep outside the thread is designed here too.

## Phase 6 — Watching it being written

A new delta kind in the stream for tool-call arguments, and a best-effort reading of unfinished JSON on the client, so the panel fills as the model writes. MCP Apps has the same idea as `tool-input-partial`. Left for last because it changes the stream contract of #519 and nothing else depends on it.

## Verification

**Done for the backend:**

- **Unit tests.** `ArtifactServiceTest`: the edit rules (replace, several in order, delete, not found, not unique, empty), types in any case and the list of types in the error, `code_language` for `CODE` only, the size limit, the next version from edits, a rename without a version, a failed edit that saves nothing, ambiguous and empty updates, an artifact of another thread. `CompletionRuntimeContextResolverTest`: the floor (raised, not raised, a higher limit kept) and the plan (tools removed, kept, plan not read without artifact tools). `CompletionServiceToolLimitTest`: a cut call is not run, is answered with the error under its own id, and the loop goes on.
- **The ephemeral environment.** The migration applies, and applies again without error or duplicate types; the API starts and imports the skill; the three endpoints answer with the expected content and versions; a missing version, a thread the user is not a member of, and an artifact of another thread all answer `404`.
- **A real provider.** An agent with the skill read it, created a `MARKDOWN` artifact, and on a request for a change updated the same artifact to version 2, renamed; each version points at the assistant message that made it.

**Done for the frontend:**

- **In Chrome, Firefox and Safari**, and on a narrow screen, on a conversation seeded in the ephemeral environment: the card with a live preview and an updated card; the artifact in the colours of the app, following a theme switch while open; the panel in the widget and the dock tab; Preview and Code, versions, *Ask for a change*; a link inside the artifact opens only after the user agrees. An artifact written to misbehave found cookies, storage, the parent page, top navigation, `fetch` and an outside image all blocked.
- **The app's built-in browser pane blocks every frame sandboxed without same-origin** (the Earth Observation frame too), so the frame cannot be tested there; everything outside the frame was.

**Still to do:**

- **The frame, further**: opening windows, submitting forms, removing or replacing the policy, and the channels a policy does not govern, in each browser. The specifics of anything found belong in the private tracker rather than in this public repo.
- **In the browser**: cards for a `MARKDOWN`, a `CODE` and a failed artifact.
- **A mock that can be told to emit a given tool call**, so the e2e suite can create an artifact without a provider key. The mock model calls only `advanced_search` today.

## Open questions

- **Public threads.** Whether an anonymous visitor reads the artifacts of their conversation, and whether the agent offers the tools there at all. Decided with the widget work; until then, no skill on public agents.
- **The value of the output floor**, and whether raising an agent's limit for artifact turns needs to be visible on the agent's settings screen. It raises what a turn can cost, and a model whose maximum output is below the floor fails the whole request: `ai_models` has no column for a model's maximum output.
- **Which plans include artifacts.** The column defaults to every plan; an artifact's output is many times a chat answer's while it counts as one answer against the plan's allowance.
- **Scripts in the widget.** An anonymous visitor on a customer's site running model-written script, even sealed, is the customer's call. A per-agent setting — *interactive artifacts in the widget* — defaulting to off is the cautious reading; without scripts an `HTML` artifact is still a styled page.
- **How `'self'` resolves in an opaque-origin frame**, per browser. Phase 2's shipped libraries depend on it; the fallback is to name the app's origin in the shell at build time, or to inline the libraries.
- **Deleting.** Artifacts go with their thread. Whether a user can remove one artifact or one version on its own is not decided.
- **Editing by hand.** A user changing the code in the panel would make a version with no message behind it. The tables allow it; the product question is whether the agent is then told.
- **The size limit**, and whether it differs by plan.
- **React as a type.** The others support it, at the price of a bundler in the frame. Plain HTML with a shipped library covers the ticket's cases; revisit after phase 2.
- **Sub-agents** get no skills, so no artifacts. Whether a sub-agent's result should be able to be one is open.
- **Tool errors are logged at `ERROR` with a stack trace**, a cut call included. That is how every tool error is logged today; whether expected model mistakes should log lower is a change for all tools.

## Notes to carry forward

- **A meta policy cannot say who may frame the page, cannot sandbox, and cannot report.** Those need a response header — phase 5.
- **Any origin allowed in the policy is a way out**, including a CDN that serves user-uploaded files. This is why libraries are shipped, not linked.
- **An opaque origin can only be addressed with `*`.** The rule that nothing secret is sent to the frame is what makes that acceptable; keep it when adding capabilities.
- **A tool result is also a `message` event** in the stream, and the frontend already matches results to calls by `toolCallId`. The card needs no new plumbing.
- **A handler bean needs no `ai_tools` row**, and an agent's own tool of the same name wins over a skill's. Do not name an agent tool `create_artifact`.
- **The assistant message is saved before its tools run**, which is why a version can reference it.
- **A new type needs two places:** the `types` row and `create_artifact`'s `enum`.
- **The resolver's order matters:** tools, then the plan check, then the output floor.
- **The finish reason is read in one place**, `CompletionService`; providers are brought to the same values in their converters.
- **`update_model_context` overwrites**; it is not a log. An app that needs history keeps it in its own state.
- **The MCP Apps specification** is in the `modelcontextprotocol/ext-apps` repository; check the bridge against it before phase 3, since it is the contract being adopted.
