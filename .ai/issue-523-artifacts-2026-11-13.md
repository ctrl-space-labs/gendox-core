# Artifacts and mini apps in the chat — [#523](https://github.com/ctrl-space-labs/gendox-core/issues/523)

The plan as first written, 2026-11-13. It covers two things the agent can put in a conversation: **artifacts** — a rendered piece of content that stands on its own, the way Claude's artifacts do — and **mini apps** — small interactive programs that live in the chat and can talk back to it.

**Status.** Nothing is implemented. The research is done: the codebase was read end to end for every seam this touches, and the prior art was read at its source.

- The frontend work is for `gendox-frontend-v2` only.
- Phase 1 is a complete, shippable feature on its own. Every later phase adds to it without changing what phase 1 stored or exposed.

The GitHub issues deliberately carry only Goal / Scope / Notes / Relationships. This document is the plan.

## Context

The ticket asks that the agent can "produce small rendered UI, not just text": info cards, data and reporting views, HTML/CSS/JS shown inline or in a side window. The scope agreed on the ticket for v2:

- a side panel beside the chat, and a compact card inline in the message that created the artifact;
- the artifact renders in a sandboxed frame with no access to the page, the session or the API — anything it needs is passed in when it is created;
- each change is a new version of the same artifact; the panel shows the latest, with earlier versions one click away;
- the same artifacts work in the embedded widget, and the side panel becomes full-screen on narrow screens.

Two words are used throughout:

- **Artifact** — content that is substantial, self-contained and worth keeping or changing: a report, a card, a diagram, a page, a piece of code. It has a title, a kind and versions.
- **Mini app** — an artifact of kind `html` that is interactive. A calculator, a quiz, a filterable table are mini apps that need nothing from outside and work from phase 1. A mini app that wants to *reach out* — put text in the composer, tell the agent what the user picked, keep state, call a tool — does so through a bridge the host controls, which arrives in phases 3 and 4.

They are one thing at two levels of capability, on one runtime. That runtime is also what [#522](https://github.com/ctrl-space-labs/gendox-core/issues/522) (code execution in the browser) and [#525](https://github.com/ctrl-space-labs/gendox-core/issues/525) (the multi-window workspace) need: a pane that shows model-authored code in isolation. [#517](https://github.com/ctrl-space-labs/gendox-core/issues/517) (Agent Skills, done) is how an agent gets the ability; [#521](https://github.com/ctrl-space-labs/gendox-core/issues/521) (chat on every page) inherits the panel.

## What the codebase already gave us

1. **A tool can exist as code alone and reach an agent through a skill.** A `DefinedToolHandler` bean (`ReadSkillTool` is the template) carries its own JSON definition and needs no `ai_tools` row. A skill's `allowed-tools` brings it into the turn: `CompletionRuntimeContextResolver.withSkillTools` takes the definition from the registry, and `SkillService.parse` accepts any tool the registry supports. Shipped skills are folders under `gendox-core-api/src/main/resources/skills/`, imported at startup by `SystemSkillImporter`. So the artifact tools need no table rows and no new wiring — only handlers and a skill folder.
2. **The handler knows which message it belongs to.** `ToolExecutionService.run` hands every backend tool a `ToolExecutionContext` whose `parentMessage` is the assistant message that carries the tool call, already saved and with an id. A version can point at its message, thread and project directly.
3. **A handler's error goes back to the model, not to the user.** A `GendoxException` thrown by a handler is turned by `AiToolRegistry.execute` into a tool result with the error code, the message and the expected schema, so the model corrects itself on the next iteration. Validation of an artifact is therefore just exceptions with good messages.
4. **Tool calls are stored with their message and replayed.** `message.tool_calls` is JSONB; the next turn replays the previous 25 to 50 messages. An artifact's content written as a tool argument is therefore stored twice and re-sent to the model on later turns — the reason updates must be small, and the reason for the stubbing in phase 2.
5. **The stream already delivers both halves.** Over SSE the `message` event carries the saved assistant message with its tool calls, and a second `message` event carries each tool result. The card can appear from the first and learn the artifact's id and version from the second, with no new event type.
6. **The stream cannot show an artifact while it is being written.** Deltas carry only answer text and reasoning text; tool-call arguments are accumulated silently. Live writing needs a new delta kind — phase 6.
7. **Thread access is already expressed, including public threads.** Reading a thread's messages is allowed to a member of the thread with read rights, or to anyone when the thread is public — which is how an anonymous widget visitor reads their own conversation. Artifacts nested under the thread reuse that rule unchanged.
8. **A completion that runs out of output tokens inside a tool call ends without a word.** The response converter keeps the finish reason `length` as it is; the loop continues only on `tool_calls`. The half-written call is saved, no tool runs, and the user sees nothing. The default output limit (`gendox.agents.max_token`) is small and `ProjectAgent.maxToken` is optional. An artifact is written *inside* a tool call, so without a decision here this is the most likely way the feature fails.
9. **v2 already has the three places an artifact opens.** The chat's sheet (the one Sources uses, with a wide variant), a dock tab routed by URL (`DOCK_ONLY` and `NEAR` in the agent home page, `DockSources` as the model), and the embedded chat page inside the widget frame. `Chat` already takes a `prefill`, and the dock already has `actions.ask(text)`.
10. **The answer already groups tool calls.** `buildTurns` yields the tool calls of a turn with their results matched by `toolCallId`, and `ChatTurn` already pulls `read_skill` calls out into their own line. An artifact card is a third group in the same place.
11. **The sandbox shell pattern is in the repo.** The Earth Observation workspace loads a static page from `public/` in a sandboxed frame; the page owns its Content Security Policy in a `<meta>` tag and talks to the host by handshake and `postMessage`. The artifact frame follows the same shape.
12. **The styles exist.** `base.css` already has the classes for an artifact card, its inline frame, the full view, its toolbar and its footer note, brought over from the prototype.
13. **v2 is a static export served as plain files.** A policy sent as a response header, or a second hostname for the frame, is a deployment change and not only code — the reason the stronger isolation is its own phase.
14. **Plan gating has a home on both sides:** `planFeatures.js` drives what the UI offers, `SubscriptionValidationService` is the control.

## Prior art, and what we take from each

| Source | What it does | What we take |
| --- | --- | --- |
| Claude artifacts (help center) | Content that is "significant and self-contained", opens in its own window beside the conversation; view code, copy, download; later: artifacts that call the model, with per-artifact storage and first-use consent | The definition of when something deserves an artifact; the panel's actions; the order in which capabilities arrive, each behind consent |
| Claude 3.5 artifacts prompt (third-party copy, not verified as current) | Good artifacts are substantial, reusable, stand alone; "when unsure, don't"; one per message; a stable identifier reused for updates | The guidance text of our skill; identity that survives updates |
| ChatGPT canvas (third-party copy) | `create_textdoc`, and `update_textdoc` with pattern/replacement instead of a rewrite | Targeted updates as the normal way to change an artifact |
| Open WebUI | Sandboxed `srcdoc` frame, scripts on and same-origin off by default, a policy prepended as a meta tag, a version selector | Confirms the defaults; the version selector |
| LibreChat | Types for html, react, svg, mermaid, markdown; a per-agent artifact mode; a fixed list of importable libraries | Kinds as a closed list; libraries as a fixed, shipped set |
| MCP Apps (SEP-1865, final) | A standard for UI that a tool returns: JSON-RPC over `postMessage`, an initialize handshake, host context (theme, tokens, display mode, size), display modes, `ui/message`, `ui/update-model-context`, `ui/open-link`, size notifications; a restrictive default policy and a requirement that host and frame have different origins | **The bridge vocabulary, adopted as is**, so the same frame can later host real MCP Apps |
| OpenAI Apps SDK | State in three kinds: business data owned by the server, UI state per rendered instance (part visible to the model, part private), cross-session state in storage the server controls | The state model of phase 4 |
| "Browser sandbox for agent-generated HTML" (agentpatterns.ai) and S. Willison's tests (2026) | Three layers: a sandbox without same-origin, a policy the content cannot remove, a typed message channel validated by the parent. A meta policy survives tag removal and document replacement in a script-only sandbox | The three layers, and the confidence to start with a meta policy |
| web.dev "Securely hosting user data" | A separate sandbox domain, a static shim that renders what it is sent, one site per piece of content | The target of phase 5 |

Glance (plivo-labs) and Postplan were also looked at: Glance confirms "untrusted HTML from a separate origin, a new version per review"; Postplan had nothing for this.

## Decisions

### One runtime, two levels

Everything model-authored that can execute — `html` and `svg` — renders in **one frame component**, used by the inline preview, the sheet, the dock tab and the widget. What a given artifact may do beyond rendering is a list of capabilities, empty in phase 1. Nothing is designed twice for "artifacts" and "apps", and #522 and #525 get the same component.

### The tools

Three handlers in a new package `ai/engine/tools/artifacts/`, shaped like `ReadSkillTool`:

- **`create_artifact`** — `title`, `kind`, `content`, and `language` when the kind is `code`. Creates the artifact and its version 1. Returns `{ artifactId, version, title, kind }`.
- **`update_artifact`** — `artifact_id`, and either `edits` (a list of `{ old_text, new_text }`, each `old_text` occurring exactly once in the current content) or `content` (a full rewrite); optionally a new `title`. Stores the result as the next version. Returns `{ artifactId, version }`.
- **`read_artifact`** — `artifact_id`, optionally `version`. Returns the content. It exists because the conversation window is finite: the creating call can scroll out of the replayed history, and a failed edit needs the real text to try again.

Rules that are errors returned to the model (finding 3), each with a message that says what to do next:

- an `old_text` that is not found, or found more than once — the message says which, and suggests `read_artifact`;
- an `artifact_id` that is not in this thread — the message lists the thread's artifacts by id and title;
- a `kind` outside the list, or content over the size limit (`gendox.artifacts.max-content-length`);
- a call with no thread to belong to (a completion that is not a conversation).

**Identity is the server's id, not a name the model invents.** The id comes back in the tool result, which is in the history the model sees; a model-chosen identifier would need uniqueness rules and collision handling for no gain.

**Kinds are a closed list**, and the list decides the renderer:

| kind | rendered by | phase |
| --- | --- | --- |
| `html` | the frame | 1 |
| `svg` | the frame (an SVG can carry script, so it is never put in the page) | 1 |
| `markdown` | the chat's own `Markdown` component, with the sanitizing it already applies to answers | 1 |
| `code` | a highlighted block with `language` | 1 |
| `mermaid` | the frame, with the library shipped in the shell | 2 |

### The skill

One shipped skill in phase 1, `artifacts`, with `allowed-tools: create_artifact, update_artifact, read_artifact`. An agent gets artifacts by adding this skill from the library, on the Skills screen that already exists; nothing else is configured.

**The tools are offered through the skill only**, not as example tools in the agent's Tools section. A tool with no guidance on when to use it produces an artifact for every answer; the skill is where the guidance lives. Its text says, in substance:

- make an artifact for content that is substantial, stands on its own, and that the user is likely to keep, reuse or ask to change; otherwise answer in the chat. When unsure, don't. One per message unless asked;
- an artifact is self-contained: one file, no network, no images from the web, no storage — everything it shows is written into it;
- style with the theme variables the frame provides, so it matches light and dark;
- to change an artifact, use `update_artifact` with edits; rewrite only when most of it changes;
- keep it compact — build a large one in steps, a first version and then edits;
- cite the document behind each fact shown.

The prototype's task-shaped skills (*Info card*, *Report with a chart*) come in phase 2 as further library skills that allow the same tools.

### Storage

Two tables, one idempotent migration (every statement guarded):

- **`artifacts`** — `id`, `thread_id` (cascade on delete), `project_id`, `title`, `kind`, `language`, `latest_version`, and the audit columns.
- **`artifact_versions`** — `id`, `artifact_id` (cascade), `version`, `content` (text), `message_id` (the assistant message that made it; set null if the message goes), `created_at`, `created_by`; unique on `(artifact_id, version)`.

**First-class tables rather than reading artifacts back out of `message.tool_calls`.** An edit-based update has no full content in its message, a list of a thread's artifacts would mean scanning every message, and phases 4 and 5 need a row to hang state and sharing on. The content stays in Postgres as text: it is small, text, and read with its row. Object storage is not needed at the sizes the limit allows.

Tools in one completion run one after another, so versions are numbered by reading `latest_version` in the same transaction; the unique constraint is the backstop.

### REST surface

Read-only, nested under the thread, guarded by the same expression as the thread's messages (finding 7). Each handler confirms the artifact belongs to the thread in the path and answers `404` otherwise. Responses are DTOs.

| method | path | purpose |
| --- | --- | --- |
| `GET` | `…/threads/{threadId}/artifacts` | the thread's artifacts, without content |
| `GET` | `…/threads/{threadId}/artifacts/{artifactId}` | one artifact: its fields, its version list (number, date, message) and the content of the latest |
| `GET` | `…/threads/{threadId}/artifacts/{artifactId}/versions/{version}` | the content of one version |

There is no write endpoint in phase 1: artifacts are made by the agent. A user's change goes through the chat.

### Output tokens, and a call that is cut short

Two decisions, both needed (finding 8):

- **A floor.** When the artifact tools are among a turn's tools, the request's output limit is raised to at least `gendox.artifacts.min-output-tokens`, whatever the agent's own setting. The agent's setting was chosen for chat answers; an artifact cannot fit in it.
- **A cut call is answered, not dropped.** When a completion ends with `length` and the message carries tool calls, each call gets a tool result with an error — the output ran out; write something smaller, or build it in steps — and the loop goes on, bounded by the iteration limit as always. This also keeps the stored history well-formed, since a tool call is then always followed by its result. In the chat, the turn shows the failure line it already has for failed tools.

This second change is in the completion loop and helps every tool, not only these.

### The frame

Three layers, each independent of the others:

1. **A sandbox without same-origin.** The frame is `sandbox="allow-scripts"` and nothing else: its origin is opaque, so it has no cookies, no storage, and no way to read the page that holds it. No top navigation, no popups, no downloads, no forms.
2. **A policy the content cannot change.** The frame loads a static shell page, `public/artifact-sandbox/`, whose first element is a `<meta>` Content Security Policy: `default-src 'none'`, inline script and style only, images from `data:` and `blob:` only. No network of any kind. The shell renders the artifact in an inner frame that inherits the policy, and stays in place as the relay for messages.
3. **A typed channel.** The host accepts messages only from the frame it created (`event.source`), only of the methods it lists, and validates each one's shape. Because an opaque origin cannot be named as a target, **the host never sends the frame anything secret** — which is the rule anyway.

**A shell page rather than `srcdoc` built by the host**: the policy and the bridge live in one file that the host cannot get wrong at a call site, the widget and the app share it, and phase 5 moves that one URL to its own origin without touching the callers.

Design requirements that follow from what a policy does not govern (navigation, and some browser features outside its reach):

- **The frame receives the artifact's content, the theme and its size — nothing else.** No token, no ids beyond its own, no user details. What was never sent cannot leave.
- **Links and downloads go through the host**, which shows the destination and opens it itself.
- The channels a policy does not cover are part of verification, in every supported browser, before phase 1 ships.

**Theme and size.** On initialize the host sends the theme (light or dark) and the app's tokens as CSS variables, named as in MCP Apps (`--color-background-primary`, `--color-text-primary`, `--font-sans`, …) and mapped from v2's own (`--surface`, `--text`, `--border-2`, `--accent-text`). A theme change is sent as it happens. The frame reports its content height, so the inline preview fits its content up to a maximum instead of a fixed box.

### The bridge

JSON-RPC 2.0 over `postMessage`, **with the method names of MCP Apps**. A vocabulary of our own would work as well today and would have to be translated the day the frame hosts an MCP App.

| phase | methods | what the host does |
| --- | --- | --- |
| 1 | `ui/initialize`, `ui/notifications/initialized`, `ui/notifications/host-context-changed`, `ui/notifications/size-changed`, `ui/open-link`, `ui/download-file` | handshake, theme, height; opens a link or saves a file after showing the user what it is |
| 3 | `ui/message`, `ui/update-model-context`, `ui/request-display-mode` | puts text in the composer; attaches a note to the user's next message; switches between inline and the panel |
| 4 | state get/set (a Gendox extension), `tools/call`, `sampling/createMessage` | durable state; a tool of the agent; a question to the agent |

Rules for every capability beyond phase 1:

- **Off unless declared.** `create_artifact` gains an optional `capabilities` list; the panel shows what an app may do.
- **The user stays the sender.** `ui/message` fills the composer and the user presses send. Nothing an app does becomes a message, a tool call or spent tokens without the user's action or a consent they gave to that app.
- **What comes out of the frame is untrusted input**, to the host and to the model: it is length-limited, and shown to the model marked as coming from the app, never as the user's words.

### Where it shows

- **In the answer** — a card where the tool call is: title, kind, version, *Open*. The creating message already holds the content in its tool call, so the card of a `create_artifact` shows a live preview **with no request**. The card of an update is compact — *Updated · v3* — and loads nothing until opened. No request per card, ever.
- **The panel** — the chat's sheet, wide; full-screen on narrow screens and in the widget. *Preview* and *Code* tabs, a version selector (latest by default), copy, download, and *Ask for a change*, which prefills the composer. The footer says who made it and that it runs sealed: it cannot reach the account, other pages or the internet.
- **A dock tab** — `/artifact?threadId=&artifactId=`, dock-only, opening beside sources and documents. One tab per artifact; a new version refreshes the tab that is open.
- **The widget** — the same card and the same panel inside the embedded chat; public threads read through the same endpoints.

A new version arriving while the panel is open moves it to the latest, unless the user is looking at an older one on purpose.

### Plan gating

One feature flag, `ARTIFACTS`, in `planFeatures.js` for what the UI offers, and a check in `SubscriptionValidationService` where the skill's tools are added to a turn. Which plans include it, and any per-plan limits, are decided outside this document.

## Phase 1 — Artifacts

The whole path, end to end, with nothing interactive beyond what an artifact does inside its own frame.

**Backend**

- The migration: `artifacts`, `artifact_versions`, indexes on `thread_id` and `artifact_id`.
- Entities, repositories, `ArtifactService` (create, add version, apply edits, read, list), DTOs and a converter.
- The three handlers, and the `artifacts` skill folder.
- The three read endpoints on the thread.
- The output-token floor, and the answer to a cut tool call, in the completion loop.
- The plan check.
- Unit tests for the edit rules (not found, not unique, several edits in order), the thread check, the size limit, and the cut-call path.

**Frontend (v2)**

- `public/artifact-sandbox/`: the shell with its policy, the inner frame, the relay.
- `ArtifactFrame` (the one component), with the phase-1 bridge.
- `artifactService.js` in the SDK and the store entries for a thread's artifacts — loaded when a panel or tab opens, not with the conversation.
- The card in `ChatTurn`, the panel in `Chat` (`onOpenArtifact`, beside `onOpenSources`), `DockArtifact` and its route, the widget's full-frame panel.
- Renderers for `markdown` and `code` outside the frame.

**Done when** an agent with the skill, asked for a summary card of a document, produces a card in the answer; it opens in the panel and as a dock tab; "make the title shorter" produces version 2 by an edit; version 1 is one click away; the same works in the widget on a public thread; and an artifact too long for the output limit ends in a visible, explained failure rather than silence.

## Phase 2 — Richer artifacts

- **Libraries, shipped with the shell** — a chart library and Mermaid, as files under the shell's folder, a fixed list named in the skill. Never a CDN: an allowed outside origin is a way out of the frame.
- `mermaid` as a kind; the task-shaped skills *Info card* and *Report with a chart*.
- **Old content leaves the replayed history.** When history is rebuilt for the model, the `content` argument of earlier `create_artifact` / `update_artifact` calls is replaced by a short fixed note naming the artifact and version — fixed, so that prompt caching still holds. The model reads the current text with `read_artifact` when it needs it.
- A list of the thread's artifacts in the chat header, once a thread has more than one.
- *Try to fix*: an error raised inside the frame is offered to the user as a prefilled message.
- **Sharing inside the organization.** The owner of the thread shares one artifact with the signed-in members of the organization: a share record (the artifact, the version or "latest", who shared it, when it ends, revoked or not), an endpoint to create and revoke it, and a page that shows the artifact in the same sealed frame. The reader is a known user, so this does not wait for the separate origin.

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

- The shell moves to **its own hostname**, with the policy as a response header (which can also say who may frame it) and a distinct origin per artifact. This is the isolation the standard requires of a host, and what is needed before the frame carries anything from another party.
- `ArtifactFrame` becomes the pane runtime of #522 and #525: code execution is the same frame with a different capability list; a window is the same frame as a tab.
- Hosting MCP Apps returned by an agent's MCP tools, on the same bridge.
- **A public link** — anyone holding the link opens the artifact, with no account. It reuses the share record of phase 2 and waits for the separate hostname: model-written HTML shown to the public must not be served under the application's own name. A copy to keep outside the thread is designed here too.

## Phase 6 — Watching it being written

A new delta kind in the stream for tool-call arguments, and a best-effort reading of unfinished JSON on the client, so the panel fills as the model writes. MCP Apps has the same idea as `tool-input-partial`. Left for last because it changes the stream contract of #519 and nothing else depends on it.

## Verification

Planned, since nothing is built:

- **The edit rules and the cut-call path** by unit test, as listed in phase 1.
- **End to end in the ephemeral environment**, through the API and the database: create, edit, full rewrite, read; a thread of another user refused; an artifact id of another thread answered `404`; a public thread readable without a login. This needs a model that calls tools — the mock model does not — so a real provider key in that environment, or a mock that can be told to emit a given tool call, which is worth adding for the test suite anyway.
- **The frame, in each supported browser**, with artifacts written to misbehave: reaching the parent, reading storage and cookies, every kind of network request, navigating itself and the top page, opening windows, submitting forms, removing or replacing the policy, and the channels a policy does not govern. Results recorded per browser; the specifics of anything found belong in the private tracker rather than in this public repo.
- **In the browser**: card, panel, versions, dock tab, widget, narrow screen, both themes, a theme switch while open.

## Open questions

- **The value of the output-token floor**, and whether raising an agent's limit for artifact turns needs to be visible on the agent's settings screen. It raises what a turn can cost.
- **Scripts in the widget.** An anonymous visitor on a customer's site running model-written script, even sealed, is the customer's call. A per-agent setting — *interactive artifacts in the widget* — defaulting to off is the cautious reading; without scripts an `html` artifact is still a styled page.
- **How `'self'` resolves in an opaque-origin frame**, per browser. Phase 2's shipped libraries depend on it; the fallback is to name the app's origin in the shell at build time, or to inline the libraries.
- **Deleting.** Artifacts go with their thread. Whether a user can remove one artifact or one version on its own is not decided; nothing in phase 1 needs it.
- **Editing by hand.** A user changing the code in the panel would make a version with no message behind it. The tables allow it; the product question is whether the agent is then told.
- **The size limit**, and whether it differs by plan.
- **React as a kind.** The others support it, at the price of a bundler in the frame. Plain HTML with a shipped library covers the ticket's cases; revisit after phase 2.
- **Sub-agents** get no skills, so no artifacts. Whether a sub-agent's result should be able to be one is open.

## Notes to carry forward

- **A meta policy cannot say who may frame the page, cannot sandbox, and cannot report.** Those need a response header — phase 5.
- **Any origin allowed in the policy is a way out**, including a CDN that serves user-uploaded files. This is why libraries are shipped, not linked.
- **An opaque origin can only be addressed with `*`.** The rule that nothing secret is sent to the frame is what makes that acceptable; keep it when adding capabilities.
- **A tool result is also a `message` event** in the stream, and the frontend already matches results to calls by `toolCallId`. The card needs no new plumbing.
- **A handler bean needs no `ai_tools` row**, and an agent's own tool of the same name wins over a skill's. Do not name an agent tool `create_artifact`.
- **The assistant message is saved before its tools run**, which is why a version can reference it.
- **`update_model_context` overwrites**; it is not a log. An app that needs history keeps it in its own state.
- **The MCP Apps specification** is in the `modelcontextprotocol/ext-apps` repository; check the bridge against it before phase 3, since it is the contract being adopted.
