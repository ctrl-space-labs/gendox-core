# Artifacts and mini apps in the chat — [#523](https://github.com/ctrl-space-labs/gendox-core/issues/523)

The current plan, 2026-11-17, written when sharing was redesigned: a shared artifact is one artifact that every member of the agent sees and changes, with what people do inside it kept as data beside its versions. It is self-contained: it carries forward everything still true from the revision of 2026-11-16 and from the [plan as first written](issue-523-artifacts-2026-11-13.md), which is kept unchanged, and adds the decisions taken while building.

It covers two things the agent can put in a conversation: **artifacts** — a rendered piece of content that stands on its own, the way Claude's artifacts do — and **mini apps** — small interactive programs that live in the chat and can talk back to it.

**Status.** Phase 1 is implemented. The backend ([#568](https://github.com/ctrl-space-labs/gendox-core/issues/568)) is verified by unit tests, in the ephemeral environment, and with a real provider creating and editing an artifact from a chat. The v2 frontend ([#569](https://github.com/ctrl-space-labs/gendox-core/issues/569)) is verified in Chrome, Firefox and Safari, and on a narrow screen. Phase 2 ([#570](https://github.com/ctrl-space-labs/gendox-core/issues/570)) is in progress: the cheaper replayed history, the Artifacts page with the conversation's own list, the *Info card* skill and *Try to fix* are built and verified (see *Phase 2*). Sharing was built as read-only shares and is being redesigned as **shared artifacts** (see *Shared artifacts* and *Artifact data*); *Continue in a chat*, which copied a shared artifact into a new conversation, was dropped before it was merged. Nothing of phases 3 to 6 is built.

- The frontend work is for `gendox-frontend-v2` only.
- Phase 1 is a complete, shippable feature on its own. Every later phase adds to it without changing what phase 1 stored or exposed.

The GitHub issues deliberately carry only Goal / Scope / Notes / Relationships. This document is the plan.

| Phase | Issue | Depends on |
| --- | --- | --- |
| 1 — backend | [#568](https://github.com/ctrl-space-labs/gendox-core/issues/568) | — |
| 1 — frontend (v2) | [#569](https://github.com/ctrl-space-labs/gendox-core/issues/569) | #568 |
| 2 — richer artifacts, shared artifacts and their data, the Artifacts page | [#570](https://github.com/ctrl-space-labs/gendox-core/issues/570) | #568, #569 |
| 3 — mini apps that talk to the chat | [#571](https://github.com/ctrl-space-labs/gendox-core/issues/571) | #569 |
| 4 — apps that call the agent | [#572](https://github.com/ctrl-space-labs/gendox-core/issues/572) | #571 |
| 5 — a separate origin, public links | [#573](https://github.com/ctrl-space-labs/gendox-core/issues/573) | #570 |
| 6 — watching it being written | [#574](https://github.com/ctrl-space-labs/gendox-core/issues/574) | #569 |
| 7 — artifacts as a service of their own | no issue yet | #570 |

Shared artifacts and artifact data stay under #570 (decided 2026-11-17).

## What changed on 2026-11-17

- **A shared artifact is one artifact, not a copy and not a read-only view.** Sharing it with the agent makes it visible to every member of the agent, and any of them can have it changed; the change is a new version everyone sees. Being a signed-in Gendox user and a member of the agent is required. Sharing with one person outside the agent, and shares that stay at one version, go.
- ***Continue in a chat* is dropped.** It copied the artifact into the reader's own conversation, which forked it. A member now opens a conversation of their own **on the same artifact**: the conversation stays personal, the artifact does not.
- **Versions are for the code; what people do inside an artifact is data.** A click, a choice, an answer or a comment never makes a version: it is stored beside the artifact, in `artifact_data`, as Claude's artifacts store theirs. This brings the durable state of phase 4 forward, in the form shared artifacts need (data only, no calls to the agent).
- ***Info card* goes into the artifacts skill.** A card is one of the things the artifacts skill makes when the user asks for one, not a skill an admin adds on its own.
- **An artifact can show inline, as part of the answer.** A small thing — a converter, a calculator, a short table — renders in the flow of the answer without a card around it, the way other assistants show a small widget (see *Inline artifacts*).
- **No artifact is cut off.** The card, the panel and the dock tab give an artifact the height it needs, and scroll when it needs more than there is (see *Sizes*).
- **Public links come forward, on the application's own address.** An owner can make an artifact public; anyone with its link sees it, read only and without an account, at an address outside `/gendox/`. This no longer waits for phase 5's separate hostname (see *Public links*).
- **The artifacts are kept ready to become a service of their own.** The new tables and endpoints are built so that artifacts, their versions and their data can later move to a separate application without changing the frame, the bridge or the agent (see *Ready to become a service*).

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
| `ARTIFACT_NOT_FOUND` | an `artifact_id` this conversation cannot reach; lists the ones it can by id and title |
| `ARTIFACT_VERSION_NOT_FOUND` | a version that does not exist; gives the range |
| `ARTIFACT_TYPE_NOT_SUPPORTED` | a kind outside `ARTIFACT_TYPE`; lists the ones there are |
| `ARTIFACT_CONTENT_TOO_LONG` | content over `gendox.artifacts.max-content-length` |
| `ARTIFACT_UPDATE_AMBIGUOUS` / `ARTIFACT_UPDATE_EMPTY` | both `edits` and `content`, or nothing to change |
| `ARTIFACTS_NEED_A_THREAD` | a call with no thread to belong to |

**Identity is the server's id, not a name the model invents.** The id comes back in the tool result, which is in the history the model sees.

**The tools reach only the calling message's thread** — as built in phase 1, with no user permission check inside them, since they cannot touch anything outside the conversation the agent is already in. Shared artifacts widen this to the artifacts the conversation was opened on, and those are checked against the user on every call (see *Shared artifacts*).

**Types and their renderers:**

| type | rendered by | phase |
| --- | --- | --- |
| `HTML` | the frame | 1 |
| `SVG` | the frame (an SVG can carry script, so it is never put in the page) | 1 |
| `MARKDOWN` | the chat's own `Markdown` component, with the sanitizing it already applies to answers | 1 |
| `CODE` | a highlighted block with `code_language` | 1 |
| `MERMAID` | the frame, with the library shipped in the shell | after phase 6 (see *After the phases*) |

A new type is a `types` row in a migration and a value in `create_artifact`'s `enum`; `ArtifactService` needs no change. `code_language` is kept for `CODE` only.

### The skill — built

`resources/skills/artifacts/SKILL.md`, `allowed-tools: create_artifact, update_artifact, read_artifact`. An agent gets artifacts when an admin adds the skill from the library on the agent's Skills screen; nothing else is configured. The tools are offered through the skill only, since the skill is where the guidance on *when* lives. Its text says, in substance:

- make an artifact for content that is substantial, stands on its own, and that the user is likely to keep, reuse or ask to change; otherwise answer in the chat. When unsure, don't. One per message unless asked;
- self-contained: one file, no network, no images, fonts or scripts from the web, no storage of its own — what a user does inside it is kept through the data capability once it exists (see *Artifact data*);
- follow the theme through CSS variables, each with a fallback: `--color-background-primary`, `--color-background-secondary`, `--color-text-primary`, `--color-text-secondary`, `--color-border-primary`, `--color-accent`, `--font-sans`, `--font-mono`;
- compact: a cut call is lost, so build a large one in steps;
- change with edits; read the artifact again when an edit fails; update the same artifact rather than making a new one per change;
- cite the documents behind the content; after the call, say in a sentence what was made, without repeating it.

**The variable names are a contract with the frame** (#569): the frame must define exactly these.

Task-shaped guidance lives inside this skill rather than in skills of its own (decided 2026-11-17): *Info card* moves in as a section — when the user asks for a card, its shape and template — and *Report with a chart*, with the libraries after phase 6, is added the same way. An agent has one skill to add for every kind of artifact.

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
| 2 | `gendox/data/*` and `gendox/user/*` (Gendox extensions, see *Artifact data*) | reads and writes the artifact's data; says who is viewing and gives names for user ids |
| 3 | `ui/message`, `ui/update-model-context`, `ui/request-display-mode` | puts text in the composer; attaches a note to the user's next message; switches between inline and the panel |
| 4 | `tools/call`, `sampling/createMessage` | a tool of the agent; a question to the agent |

Rules for every capability beyond phase 1:

- **Off unless declared.** `create_artifact` and `update_artifact` gain an optional `capabilities` list (from phase 2, for `data` and `user`), stored on the artifact; the panel shows what an app may do.
- **The user stays the sender.** `ui/message` fills the composer and the user presses send. Nothing an app does becomes a message, a tool call or spent tokens without the user's action or a consent they gave to that app.
- **What comes out of the frame is untrusted input**, to the host and to the model: length-limited, and shown to the model marked as coming from the app, never as the user's words.

### Shared artifacts — designed 2026-11-17, not built

**One artifact, seen and changed by every member of the agent.** The owner of the conversation an artifact was made in shares it with the agent. From then on every signed-in member of the agent sees it on the agent's Artifacts page, at its latest version with its earlier versions one click away, and any of them can have it changed. Someone who leaves the agent loses it. People outside the agent do not see it; people outside the organization wait for phase 5's public link.

**A change is made in a conversation of one's own, on the same artifact.** A member opens a shared artifact and chooses *Change it in a chat*. A new conversation of theirs starts **opened on that artifact**: no copy is made, and nobody else sees the conversation.

- The link between a conversation and an artifact it was opened on is a row of its own (the artifact, the thread, who, when), since an artifact can be opened from many conversations and a conversation could be opened on more than one.
- The agent learns about it without made-up tool calls in the history, which some providers sign: on each turn the resolver adds one item to the session items `ChatTemplateAuthor` renders, after the message's own — the artifact's id, title, type and latest version, that it is shared, and that its content is not in the conversation and is to be read with `read_artifact` before it is changed. The item is added only when the agent has the artifact tools.
- The tools reach the conversation's own artifacts and those it was opened on. For the second kind they check, on every call, that the artifact is still shared and the user is still a member of the agent; otherwise the artifact is out of reach, the same as one that does not exist.

**Every version says who made it and from which conversation.** `artifact_versions` already records `created_by` and the message; for a shared artifact the panel shows the person beside each version. Another member never sees the conversation, only the name.

**Two people changing it at once** — decided: no lock. An edit already fails when its `old_text` is not in the latest text, so an edit written against an older reading cannot silently undo someone else's change. A full rewrite (`content`) could: it is accepted only when the conversation has read, or itself made, the latest version; otherwise the tool answers with an error asking the agent to read it again. The version that was read is known from the conversation's own tool calls.

**Sharing is simpler than what was built.** The share record built in phase 2 had two audiences and an optional fixed version. Shared artifacts need neither: an artifact is shared with its agent or it is not. Decided: the state lives in columns on `artifacts` — shared (at, by), locked (at, by) and public (`public_id`, at, by, and whether its shared data shows) — rather than in a table of shares. A forward migration adds them and drops `artifact_shares`, which has not reached production; its service, predicates, converter, controller and DTOs go with it.

**Who may change it** — decided: every member of the agent, unless the owner has locked it.

**What the owner may do** — decided. The owner is the person who made the artifact (its creator), and only they may:

- **stop sharing** — it is theirs alone again; conversations of others opened on it no longer reach it, and it leaves the agent's shared list;
- **lock it** — the others still see it and still use it, writing its data, but cannot change its code: the tools answer that it is locked, and *Change it in a chat* is not offered. Unlocking gives the change back;
- **delete it** — for everyone, with its versions and its data, after a confirmation that says so.

Admins of the agent get none of these for now.

**The owner's conversation and the shared artifact** — decided: a shared artifact stays when the conversation it was made in is deleted. `artifacts.thread_id` changes from cascade to set null; an artifact that is not shared still goes with its conversation, deleted by the service with it. An artifact whose conversation is gone stays its owner's: it shows on their Artifacts page, and if they stop sharing it, it stays there, theirs alone, until they delete it.

### Artifact data — designed 2026-11-17, not built

**What it is.** What people do inside an artifact — a vote, a choice between A and B, an answer, a comment, a ticked box — is stored as data of the artifact, never as a new version. The artifact's code changes only when the agent changes it (or, later, a person edits the code). This is the model of Claude's artifacts, which keep the code in versions and what viewers do in a database of the artifact that the page reads and writes.

| A new version (the code changes) | Not a version (the data changes) |
| --- | --- |
| `update_artifact`, from any conversation that can reach it | A click, a choice, a vote |
| *Try to fix* | An answer in a form, a comment, a ticked box |
| Going back to an earlier version | Anything a person does inside the artifact |
| Later, editing the code by hand | |

**The table `artifact_data`** holds documents grouped in collections, each document a JSON value. It has no columns for what an artifact stores: the agent decides the shape when it writes the code, as Claude does.

| column | type | holds |
| --- | --- | --- |
| `id` | uuid | |
| `artifact_id` | uuid, references `artifacts`, cascade | the artifact it belongs to |
| `collection` | text | e.g. `decisions`, or `users/<userId>` for a person's own |
| `doc_id` | text | the key the artifact chose, e.g. `item-12` |
| `data` | jsonb | the document, as the artifact wrote it |
| `private_to` | uuid, nullable | empty: every member who can see the artifact reads it; set: only that user |
| `revision` | integer | raised on every write; a write that names an older revision is refused as a conflict |
| `created_by`, `updated_by` | uuid | set by the server from the signed-in user, never by the artifact |
| `created_at`, `updated_at` | timestamp | |

- Unique on `(artifact_id, collection, doc_id, private_to)`; indexed on `(artifact_id, collection, updated_at)` for a collection's list.
- A size limit per document and per artifact, in configuration.
- **Data belongs to the artifact, not to a version.** A new version reads the data the previous one wrote, which is why the skill asks the agent to keep collection and field names when it changes the code.
- The user columns carry no foreign key to `users` (see *Ready to become a service*).

**How the artifact reaches it.** The frame is sealed — no network, no token — so the artifact never talks to the API. A small script the shell puts in place before the artifact's own gives it `gendox.use(name)`, which resolves to the capability's functions, or `null` when the artifact did not declare it or the viewer may not use it:

```js
const data = await gendox.use('data')        // null: the artifact works without saving
const user = await gendox.use('user')
const me = await user.id()

await data.doc('decisions/item-12').set({ choice: 'B', comment: '…', by: me })
data.collection('decisions').onChange(docs => render(docs))
const names = await user.profiles(ids)       // names come from the host, never stored
```

Each call becomes a bridge message (`gendox/data/get`, `…/set`, `…/update`, `…/delete`, `…/list`, and a `gendox/data/changed` notification; `gendox/user/id`, `gendox/user/profiles`). The host checks it — this frame, a declared capability, the size and the rate — and calls the API with its own token, which never reaches the frame. Answers and changes go back the same way.

- **Live changes** are polled by the host while the artifact is open, at first; a push over the existing stream can come later without changing the artifact's side.
- **Who may write** — decided: every member who can see the artifact writes shared documents; a private document is read and written only by its user. Documents are shared by default, and the artifact chooses a private one by writing it with `private: true` (or under `users/<id>`, as the skill teaches). Finer rules per collection, as Claude has (e.g. "everyone reads, each writes only their own"), come later, in the declaration of `capabilities`, without changing the table.
- **Endpoints** sit under the artifact, not under a conversation: `…/artifacts/{artifactId}/data/{collection}` and `…/data/{collection}/{docId}`, signed-in people only, checked against the artifact's access on every call.
- **What an artifact writes is untrusted.** The host shows it only as text; the agent reads it only as data.

**How the agent knows how to use it.** Three things, none of them configured per artifact:

1. **The skill teaches the API**: what goes into data and what into the code, to store ids and never names, to work with an empty collection and with `null` from `use()`, and to keep collection and field names when changing the code.
2. **The artifact declares it**: `capabilities: ["data", "user"]` on `create_artifact` / `update_artifact`, stored on the artifact. The host puts in only what is declared.
3. **The agent invents the shape**: asked for "a page where each person picks A or B", it writes something like `votes/<userId> = { choice: "A" }`. Nothing is connected in advance. When it changes the artifact it reads the code first with `read_artifact`, and sees the collections it uses.

Optionally, a fourth tool, `read_artifact_data`, lets the agent answer "what did each person pick?" or summarize the answers. It returns data written by users, which the agent treats as data and never as instructions.

### Ready to become a service — a principle from 2026-11-17

Artifacts, their versions and their data may later move to an application of their own (phase 7). Nothing is built for that now, but what is built from here keeps it possible:

- **The artifact never knows where its data lives.** Its only contract is `gendox.use(…)` and the bridge. If the host later calls another service, no artifact and no skill changes.
- **The new tables stand alone.** `artifact_data` and the conversation links reference only `artifacts`; user ids are plain uuids with no foreign key to `users`; no query joins them with threads, projects or users.
- **Access is decided in one place**: one check, "may this user read or write this artifact", which today reads the agent's membership from the database and later becomes a call to the core or a scoped token.
- **New endpoints sit under the artifact**, not under a conversation.
- **What is not yet ready:** `artifacts` has foreign keys to threads and projects. Moving it means turning them into plain ids, which stays a small change as long as nothing new relies on joins through them.

This is a separate matter from phase 5, which moves only the frame's page to its own hostname and leaves the backend where it is.

### Where it shows — #569

- **In the answer** — a card where the tool call is: title, type, version, *Open*. The creating message already holds the content in its tool call, so the card of a `create_artifact` shows a live preview **with no request**. The card of an update is compact — *Updated · v3* — and loads nothing until opened. No request per card, ever. A version's `messageId` is the assistant message that carries its call, which places the card.
- **The panel** — the chat's sheet, wide; full-screen on narrow screens and in the widget. *Preview* and *Code* tabs, a version selector (latest by default), copy, download, and *Ask for a change*, which prefills the composer. The footer says who made it and that it runs sealed.
- **A dock tab** — `/artifact?threadId=&artifactId=`, dock-only, opening beside sources and documents. One tab per artifact; a new version refreshes the tab that is open.
- **The widget** — the same card and the same panel inside the embedded chat, once public threads are opened (see *REST surface*).

A new version arriving while the panel is open moves it to the latest, unless the user is looking at an older one on purpose.

### Inline artifacts — designed 2026-11-17, not built

**Some artifacts are part of the answer, not an attachment to it.** Asked for "a euro to dollar calculator", the answer can *be* the calculator: it renders in the flow of the text, with no card header, no frame border and no *Open* button in the way, sized to its content.

- `create_artifact` gains `display`: `card` (as today) or `inline`. The skill says when: `inline` for something small and interactive that answers the question in place — a converter, a calculator, a short table or chart, a few controls; `card` for anything long, anything the user is likely to keep, change or share, and every document.
- An inline artifact is still an artifact: it has versions, it is listed in the conversation and on the Artifacts page, it can be shared. Hovering it (or a small control under it on touch screens) offers *Open*, which shows it in the panel as any other.
- The display is stored on the artifact; a later version keeps it unless the agent changes it. `ui/request-display-mode` of phase 3 lets an app ask to move between the two while it runs.
- An inline artifact runs in the same sealed frame. Only its chrome changes.
- **The user can switch it** — decided: *Show as a card* / *Show inline* in the artifact's menu. It changes how it is shown, not its code, so it makes no version and needs no agent. It is stored on the artifact, so everyone who sees a shared artifact sees the same.

### Sizes — 2026-11-17

What was built is too tight: the card's preview stops at a fixed small height, and in the panel or a small dock tab an artifact that is taller than the space is cut off with no way to reach its lower part (a game whose start button sits below the fold). The rules from now on:

- **Nothing is ever cut without a way to reach it.** Where an artifact is taller than its space, the space scrolls.
- **The card and inline artifacts** grow with their content (the frame already reports its height) up to a generous maximum, about the height of the window; beyond it the frame scrolls inside, and *Open* shows it whole.
- **The panel and the dock tab** give the frame the larger of the space available and the height the content reports, inside a scrolling area; a maximized tab gets the whole window.
- **The skill** tells the agent that an artifact may be shown small: no layout that depends on the full window height (`100vh`) for its controls, the main controls near the top, and the page allowed to scroll.

### Public links — designed 2026-11-17, not built

**Decided:** artifacts can be opened by people without an account, read only, through a link, at an address outside `/gendox/`. The owner chooses whether an artifact is public; it is not by default.

- **The address.** `/a/{publicId}` shows the latest version; `/a/{publicId}/v/{version}` one version, which never changes. (The application is a static export, so the page is a single route that reads the rest of the address; the server sends every `/a/…` path to it.) The agent and the organization are not in the address.
- **`publicId` is a random id of its own**, not the artifact's id: making an artifact private ends every link at once, and making it public again gives a new link, so an old one does not come back to life. The artifact's internal id is never exposed.
- **What a public reader gets:** the artifact in the same sealed frame, its title and kind, the agent's name, copy and download — never the conversation, the organization or its members, its other versions (unless the link names one) or the names of who made it or wrote its data. `use('user')` answers `null`, and `use('data')` too unless the owner chose to show the shared data (below).
- **Who may make it public:** the owner. A locked artifact can be public; stopping sharing in the agent does not by itself make it private.
- **The organization can turn them off** — decided: a setting of the organization, on by default, changed by its admins. Off, every public link of the organization answers as not found at once, without forgetting which artifacts were public, so turning it on again brings the same links back. Whether a plan includes public links is a plan column, as for artifacts themselves.
- **Shared data, read only, when the owner says so** — decided: making an artifact public offers a second choice, *also show its shared data* (off by default). With it, a public reader's `use('data')` reads the artifact's shared documents and refuses every write; private documents are never shown; `use('user')` stays `null`, so no names reach a public reader.
- **The page names the agent** — decided: "Made by the AI agent <agent name> on Gendox", with the sealed-frame note. Not the organization, not the person who made it.
- **Backend:** a public state on the artifact (the `publicId`, by whom, when); `POST` / `DELETE` to make it public or private, for the owner; and one read endpoint, `GET …/public/artifacts/{publicId}` (and `…/versions/{version}`), named one by one in the security configuration for `GET` without a login, never with a wildcard. It returns only what a public reader gets, as a DTO of its own.
- **The risk this accepts, and what limits it.** The first plan kept public links for phase 5 because model-written content shown to the public under the application's own name can be made to look like the application. It now comes first; what limits it until phase 5 moves the frame to its own hostname: the content still runs in the sealed frame with no network; the page around it says plainly that it was made by an AI agent and not by the application or the organization, and that it runs sealed; the owner's choice, never a default; the public page is not indexed by search engines; and a public artifact can be made private at once. The specifics of what the frame does not yet stop belong in the private tracker, not here.

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

Built in this order, each a commit of its own: the cheaper history, the Artifacts page and the conversation's list, the *Info card* skill, *Try to fix*, and sharing last, since it adds a section to the Artifacts page (all **built**). Sharing is now being redesigned as shared artifacts with their data (see below). Libraries, `MERMAID` and *Report with a chart* moved after phase 6 (see *After the phases*): nothing in phases 2 to 6 needs them, and an artifact can already draw a chart in SVG or plain script.

- The task-shaped skill *Info card*.
  - **Built.** `resources/skills/info-card/SKILL.md`, imported into the library on startup like the other system skills; an admin adds it to an agent. No migration and no code: the artifact tools come with the skill's `allowed-tools`, and plan gating reads tools, not skill names.
  - `allowed-tools: create_artifact, update_artifact, read_artifact, advanced_search, read_document` — a card about one document reads all of it, not only what search returns.
  - The skill fixes the card's shape (title and what it is, four to eight key facts, a summary of at most three sentences, an optional *Watch out*, the sources) and gives a short HTML template that follows the theme variables and needs no script, so cards look alike and stay small. Only what the documents say goes on a card; a missing fact is left out. It stands on its own, so an agent can have it without the general artifacts skill.
  - Verified with Gemini on a real document.
  - **To change (2026-11-17): it goes into the artifacts skill.** Its shape and template become a section of `resources/skills/artifacts/SKILL.md`, and the artifacts skill gains `advanced_search` and `read_document` in its `allowed-tools`, so that a card about a document can read it. The `info-card` folder is removed. The startup importer does not remove a skill that is no longer shipped, so a migration moves the agents that have *Info card* to the artifacts skill (adding it where they lack it) and removes *Info card* from the library.
- **Old content leaves the replayed history.** When history is rebuilt for the model, the `content` argument of earlier `create_artifact` / `update_artifact` calls is replaced by a short fixed note naming the artifact and version — fixed, so that prompt caching still holds. The model reads the current text with `read_artifact` when it needs it.
  - **Built.** `ArtifactHistory.withoutArtifactContent` rewrites the history read for a completion, never what is stored. The note is one fixed sentence for every call: the call's own `artifact_id` and its result already name the artifact and version, so the note needs no detail and stays byte-identical across turns. Only the replayed history is rewritten; a sub-agent's history, passed in by its caller, is left as given.
  - Verified with Gemini, whose thought signatures travel unchanged beside the shortened arguments: asked to change an earlier artifact, the agent read it with `read_artifact` and updated the same artifact.
  - **Failed tries made good.** In the chat, a failed `create_artifact` / `update_artifact` that a later call in the same turn made good — an update of the same artifact, or a create after a failed create — shows with the other tools in the turn's "Used …" line instead of as a warning card. A failure that stays a failure keeps its card.
- A list of the thread's artifacts in the chat header, once a thread has more than one.
  - **Built.** The list is read from the thread's messages — each create and update call and its result — rather than requested, so it needs no request and follows the agent as it writes. Last changed first; a choice opens the artifact at its latest version where its card would. A chat with no header (the agent home's tab) shows it as a small bar above the conversation.
- *Try to fix*: an error raised inside the frame is offered to the user as a prefilled message.
  - **Built**, frontend only. The bridge inside the artifact, which runs before the artifact's own scripts, reports unhandled errors and rejections — at most three per render, the message and its line. The shell cleans the message (control characters out, 300 characters at most) and relays it with MCP's `notifications/message` at level `error`; the host shows the first.
  - The card and the panel show the error with **Try to fix**, which writes a request naming the artifact, the line and the message into the composer. It is never sent on its own: the user reads it and sends it, or not. The message is the artifact's own text, so it is only ever shown as text and only ever reaches the model through the user.
  - Offered on the latest version only; an older card says a later version changed it. Where no composer is at hand (the agent home's artifact tab, the Artifacts page) the error is shown with a hint to ask in the conversation.
  - Verified in Chrome: the reported line matches the failing line; the request lands in the composer unsent; after a fixing `update_artifact`, the old card offers no fix and the latest version shows no error.
- **Sharing inside the organization, as first built** — read-only shares. **Superseded** by shared artifacts (below); kept here because it is what the branch holds today and what the redesign changes. The owner of the thread shares one artifact with the signed-in members of the organization: a share record (the artifact, the version or "latest", who shared it, when it ends, revoked or not), an endpoint to create and revoke it, and a page that shows the artifact in the same sealed frame. The reader is a known user, so this does not wait for the separate origin.
  - **Built.** Two audiences, chosen by the owner:
    - **Everyone in the agent** (`PROJECT`): the agent's members, now and later; someone who leaves the agent loses it.
    - **One person** (`USER`): any member of the organization, also one who is not a member of the agent; someone who leaves the organization loses it. Not the owner, not an agent.
    - Each share follows the latest version or stays at the one chosen; the dialog defaults to the latest. One active share per audience and person: sharing again replaces the earlier share, whose link stops working. People outside the organization wait for phase 5's public link.
  - A reader sees the artifact, its kind, who shared it and when, and the version — never the conversation, its other artifacts or its other versions. The reader's response carries no thread at all.
  - Backend: the table `artifact_shares` (the artifact, an optional version, the audience type, the person, an optional end, revoked at and by, created at and by), with one partial unique index per audience for the active share; revoked shares stay as history. `ArtifactShareService`, `ArtifactShareCriteria` and `ArtifactSharePredicates`, `ArtifactShareConverter`, and `ArtifactShareController`:
    - `GET` / `POST threads/{threadId}/artifacts/{artifactId}/shares` and `DELETE …/shares/{shareId}`: the owner's list, share and stop. Thread members only; stopping twice is not an error.
    - `GET artifact-shares/{shareId}`: one shared artifact with its content, for the owner, the named person, or a current member of the agent, checked again on every open. Anyone else gets `404`, the same as a share that does not exist.
    - `GET organizations/{organizationId}/artifact-shares?projectId=`: what others shared with the signed-in user, without content, newest first, searchable by title and type. The reader, the organization and the reader's agents always come from the signed-in user, whatever the request says.
    - Every share endpoint needs a signed-in person (`SecurityUtils.isSignedInPerson`): not an API key, not an agent.
  - Frontend:
    - **Share** in `ArtifactView` (the panel, the artifact tab, the Artifacts page) opens `ArtifactShareDialog`: what new shares show (*the latest version* or *this version*), *Everyone in <agent>* as a switch, a choice of people from the organization's members, and per share its version, *Copy link* and stop.
    - The reader's page `/gendox/shared-artifact?organizationId=…&shareId=…`: Preview and Code, copy and download, in the same sealed frame. An error inside it is shown with a hint to tell the person who shared it; there is no *Try to fix*.
    - The Artifacts page has two tabs, *Yours* and *Shared with you*; the second shows this agent's shares or every agent's in the organization, including agents the user is not a member of.
    - The page guard keeps a page's own query parameters when it corrects the organization and agent in the URL, so the link survives it. A dialog opened from another one closes alone on Escape.
  - Verified by unit tests (the service's checks, the predicates, the controller's overwrite of the reader), and in the ephemeral environment with four users through the API and in Chrome: a member of the organization outside the agent opens the link shared with them and sees it under *Every agent*, and gets *can't be opened* for the agent's share; an agent member sees both the agent's share and their own; a replaced or stopped share answers `404`.
  - Not handled: a member of the organization with no agent at all is sent to create one before a link opens, as on every page.
- ***Continue in a chat* — dropped.** It copied a shared artifact into a new conversation of the reader's, which forked it. Its backend was written and tested but not merged. What carries over is the way the agent learns about an artifact that is not in its history: a session item added per turn (see *Shared artifacts*).
- **Shared artifacts** (next, not built; see *Shared artifacts* in *Decisions*):
  - Backend: the shared state on the artifact (shared, locked), replacing `artifact_shares`; `thread_id` set null instead of cascade, with the service deleting an unshared artifact with its conversation; stop sharing, lock and delete for the owner; the conversation-to-artifact link; the session item; the tools' wider reach with its per-call check; the rewrite rule for two people changing it at once; a *Change it in a chat* endpoint that starts the conversation and its link.
  - Frontend: *Share with <agent>*, *Stop sharing*, *Lock* and *Delete* for the owner in `ArtifactView`; the Artifacts page's second tab becomes *Shared in this agent*, listing every shared artifact of the agent; a shared artifact opens in the same view with its versions and who made each, *Restore this version* (a new version with that content), and *Change it in a chat*; the read-only reader page and the share dialog go.
- **Artifact data** (after shared artifacts; see *Artifact data* in *Decisions*):
  - Backend: `artifact_data`, its service and endpoints, `capabilities` on the artifact and on the two tools, and optionally `read_artifact_data`.
  - Frontend: the `gendox.use` script in the shell, the `gendox/data/*` and `gendox/user/*` methods in the host with their checks, polling while open.
  - The skill: the data API and its rules.
- **The output floor on the agent's settings screen**, and the model's maximum output on `ai_models` capping it; **usage by tokens** for artifact turns, with the subscription work.
- **Inline artifacts and sizes** (see *Inline artifacts* and *Sizes* in *Decisions*): `display` on the artifact and on `create_artifact`, and the user's *Show as a card* / *Show inline*; the inline rendering in `ChatTurn`; the new height rules in `ArtifactFrame`, the card, the panel and the dock tab; the skill's guidance on both.
- **Public links** (see *Public links* in *Decisions*): the public state and its endpoints; the organization's setting and the plan column; the owner's *also show its shared data*; the page under `/a/`, outside the application's layout and guard; *Make public* / *Make private* and *Copy public link* for the owner in `ArtifactView`; the server rule that sends `/a/…` to that page in every environment.
- Write endpoints (sharing, data, public links, later editing by hand) require a signed-in user and are never let through the security configuration without a login.
- **An Artifacts page for each agent**, beside Tasks and Knowledge in the agent's menu, as a page and as a dock tab. It lists the artifacts of the conversations the user can open with this agent — never every artifact of the agent: a conversation is personal, and its artifacts are shown to others only by sharing. With sharing, a second section lists what was shared (as built: shared with the user; with shared artifacts: every artifact shared in this agent).
  - Backend: `GET …/organizations/{organizationId}/projects/{projectId}/artifacts`, without content, paged, newest change first, searchable by title and filtered by type. It returns the artifacts of the threads the user is a member of, filtering rather than refusing, so one thread out of reach never empties the list.
  - Frontend: a row per artifact with its type, title, version, date and the conversation it came from. A click opens it in `ArtifactView` (the panel, or the artifact tab); a second action opens the conversation.
  - **Built.**
    - Backend: `ArtifactCriteria` and `ArtifactPredicates`, the codebase's criteria-and-predicates pattern. The controller always sets the project from the path and the member from the signed-in user, whatever the request says; with either missing the predicate matches nothing. The member condition is a subquery on the thread's members. A page holds at most 100; unsorted, it is the last changed first. Each row carries `threadName`, read for the whole page in one query.
    - Frontend: the page `/gendox/artifacts` in the agent's menu, with search and a kind filter; a row opens the artifact in a dialog, with *Open the conversation*. In the agent home, `/gendox/artifacts` is a dock tab with search, whose rows open the artifact's tab.
    - Verified by unit tests (the predicates, the controller's overwrite of project and member, page size and order) and in the ephemeral environment: a project member who is not in the conversation sees none of its artifacts, also when the request names another user; the sealed frame keeps its isolation inside the dialog, in Chrome.

## Phase 3 — Mini apps that talk to the chat

- `capabilities` (arrived in phase 2 with artifact data) gains the phase-3 names, shown in the panel.
- `ui/message` — the app proposes a message; it lands in the composer.
- `ui/update-model-context` — the app states what the user has selected or entered; the latest statement travels with the user's next message, marked as coming from the app. Each statement replaces the previous one.
- `ui/request-display-mode` — inline or panel.
- UI state per rendered instance, kept by the host for the life of the page.
- Skill guidance for apps: what to declare, and to work without the bridge when a capability is refused.

## Phase 4 — Apps that call the agent

- **Durable state moved to phase 2** as *Artifact data*: shared by default with a per-user kind, stored on the server, size-limited. Never `localStorage`: the frame has none, by design.
- **`tools/call`** — an app runs a tool of its agent through the host. Limited to the tools the agent already has, read-only tools first, behind a consent given once per app.
- **`sampling/createMessage`** — an app asks its agent a question. It spends the organization's usage, so it is counted like any completion and asked for on first use.

Each of these opens a path from model-written code to something that costs or acts. None of them ships without its own review.

## Phase 5 — A separate origin, and the shared runtime

- The shell moves to **its own hostname**, with the policy as a response header (which can also say who may frame it) and a distinct origin per artifact.
- `ArtifactFrame` becomes the pane runtime of #522 and #525: code execution is the same frame with a different capability list; a window is the same frame as a tab.
- Hosting MCP Apps returned by an agent's MCP tools, on the same bridge.
- **Public links move to the separate hostname.** They are built in phase 2 on the application's own address (see *Public links*); here the public page moves to the frame's own hostname, which removes the risk accepted there. Old `/a/…` links redirect.

## Phase 6 — Watching it being written

A new delta kind in the stream for tool-call arguments, and a best-effort reading of unfinished JSON on the client, so the panel fills as the model writes. MCP Apps has the same idea as `tool-input-partial`. Left for last because it changes the stream contract of #519 and nothing else depends on it.

## Phase 7 — Artifacts as a service of their own

Artifacts, their versions, their data and the conversation links move to an application of their own, with its own database. The core keeps the conversations, the agents and the tools; the tools and the host call the new service. Possible without changing the frame, the bridge, the skill or what is stored, as long as *Ready to become a service* is kept. Not designed further: when, and whether at all, is decided later.

## After the phases — libraries, Mermaid and *Report with a chart*

Moved here from phase 2, as an improvement once phases 2 to 6 are done.

- **Libraries, shipped with the shell** — a chart library and Mermaid, a fixed list named in the skill. Never a CDN: an allowed outside origin is a way out of the frame.
- `MERMAID` as a type, rendered in the frame with the library, in the app's light or dark theme and with the library's strictest security level.
- The skill *Report with a chart*.

**What was checked (2026-11-16), in Chrome, against the real shell.** Under the frame's current policy no file loads into an artifact — not a path relative to the shell, not a full URL on the application's own server. A script written inline runs; one of 3 MB, the size of Mermaid, renders in about 180 ms. Letting files load would mean naming the application's origin in a policy that is a static file and differs per installation, and it would give the frame its first route to a server.

**The way chosen, for when this is built.** The application, not the frame, fetches the library: the artifact names it with a placeholder from the fixed list (e.g. `<script data-library="chart.js"></script>`); the host reads the file from its own server once, keeps it in memory, and sends its text with the artifact; the shell puts it in place inline. The frame's policy does not change and the frame keeps no network at all. A name outside the list stays a placeholder and does nothing.

**Still open.** Where the library files come from: development dependencies at an exact version, copied into the shell's folder at build time, or the files committed to the repository.

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

**Shared artifacts and their data — decided 2026-11-17** (folded into *Shared artifacts* and *Artifact data* above): data shared by default, the artifact choosing a private document; two people changing it at once with no lock; every member of the agent may change it; the owner alone stops sharing, locks and deletes; a shared artifact outlives its conversation; a single write rule now, per-collection rules later; the work stays under #570.

**Decided later the same day:** the share state as columns on the artifact, replacing `artifact_shares`; public links on by default with an organization setting to turn them off; a public reader sees shared data, read only, only when the owner chooses it; the public page names the agent; the user can switch inline and card; versions are never deleted, only restored; editing by hand later; interactive artifacts in the widget behind a per-agent setting, off by default. Each is written into its section above.

**From before:**

- **Resolved:** *scripts in the widget* — a per-agent setting, *interactive artifacts in the widget*, off by default; without scripts an `HTML` artifact is still a styled page. *Deleting* — the owner deletes a whole artifact (see *Shared artifacts*); a single version is never deleted: going back to one makes a new version with its content, so the history stays whole and a link to a version keeps working. *Editing by hand* — later, not in phase 2; the changes go through the chat. *How `'self'` resolves in an opaque-origin frame* — no longer needed: the libraries are sent in by the host and put inline (see *After the phases*).

**Decided on 2026-11-17, from before:**

- **The output floor stays, and shows.** The agent's settings screen says that in turns where it can write an artifact the output limit rises to the floor. `ai_models` gains the model's maximum output, and the floor never asks for more than the model allows, so a model with a smaller maximum is not failed by it.
- **Every plan has artifacts, counted by what they use.** `artifacts_enabled` stays on for every plan. A turn that writes an artifact counts against the plan's allowance by the tokens it used rather than as one answer; how tokens turn into the allowance's unit is decided with the subscription work.
- **One size limit for everyone**, in configuration (`gendox.artifacts.max-content-length`); the limits of artifact data are configuration too. No per-plan column.
- **Sub-agents get no artifacts for now**: a sub-agent returns text, and the agent that called it makes the artifact. **React is not a type for now**: plain HTML with the shipped libraries covers what is asked; revisited after phase 2.

Still open:

- **Public threads.** Whether an anonymous visitor reads the artifacts of their conversation, and whether the agent offers the tools there at all. Decided with the widget work; until then, no skill on public agents. Public links (see *Public links*) do not need this: they are a separate page.
- **Tool errors are logged at `ERROR` with a stack trace**, a cut call included. That is how every tool error is logged today; whether expected model mistakes should log lower is a change for all tools, outside this plan.

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
- **`update_model_context` overwrites**; it is not a log. An app that needs history keeps it in its own data.
- **The frame never gets the token, also for data.** Every data call goes frame → host → API; the host is the only one that holds the token and decides.
- **An interaction is never a version.** If a design makes clicks write the artifact's code, it has the model wrong.
- **The MCP Apps specification** is in the `modelcontextprotocol/ext-apps` repository; check the bridge against it before phase 3, since it is the contract being adopted.
