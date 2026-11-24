# Artifacts and mini apps in the chat — [#523](https://github.com/ctrl-space-labs/gendox-core/issues/523)

The current plan, 2026-11-24, written when shared artifacts were built: an artifact is shared as Claude's artifacts are, with roles, and a member with the right role changes it in a conversation of their own. It is self-contained: it carries forward everything still true from the revisions of 2026-11-16 and 2026-11-17 and from the [plan as first written](issue-523-artifacts-2026-11-13.md), which is kept unchanged, and adds the decisions taken while building.

It covers two things the agent can put in a conversation: **artifacts** — a rendered piece of content that stands on its own, the way Claude's artifacts do — and **mini apps** — small interactive programs that live in the chat and can talk back to it.

**Status.** Phase 1 is implemented. The backend ([#568](https://github.com/ctrl-space-labs/gendox-core/issues/568)) is verified by unit tests, in the ephemeral environment, and with a real provider creating and editing an artifact from a chat. The v2 frontend ([#569](https://github.com/ctrl-space-labs/gendox-core/issues/569)) is verified in Chrome, Firefox and Safari, and on a narrow screen. Phase 2 ([#570](https://github.com/ctrl-space-labs/gendox-core/issues/570)) is in progress: the cheaper replayed history (now also for what `read_artifact` returned), the Artifacts page, the *Info card* skill, *Try to fix* and **shared artifacts with roles** — the backend, the v2 screens and *Change it in a chat* — are built and verified (see *Phase 2*). *Info card* is now a section of the artifacts skill. Still to come in phase 2: artifact data, the public page, inline artifacts and sizes, and the output floor on the settings screen. Nothing of phases 3 to 6 is built.

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

## What changed on 2026-11-24

- **Sharing has roles, as Claude's artifacts do.** Not "shared with the agent or not, and maybe locked": each person has a role on an artifact — **Viewer** sees it, **Contributor** also uses it (what they do inside it is kept as its data), **Editor** also changes it with the agent — and its **owner** alone shares it and deletes it. The owner gives every member of the agent one role (*general access*), or none, and invites members of the agent by name, each with a role. A person's role is the higher of the two. Locking is gone: an owner who wants the others not to change it gives them Viewer or Contributor (see *Shared artifacts*).
- **The owner is a column.** `artifacts.owner_id` is the person who made it, set when it is created.
- **A conversation is never deleted, so the artifact needs no change to outlive it.** Conversations are soft-deleted (`chat_thread.is_active`); `artifacts.thread_id` keeps its cascade. An artifact whose conversation was deleted stays on its owner's list while it is shared with anyone.
- **The agent learns which artifacts a conversation was opened on as a listing**, in the form of the files listing of the agent platform work (`FileListing`), one line per artifact with the user's role, and gets the artifacts skill for that conversation even when the agent does not have it (see *Shared artifacts*).
- **What `read_artifact` returned leaves the replayed history too**, as the content of `create_artifact` and `update_artifact` already did.
- **The read-only shares built first are gone** — their table, endpoints, page and dialog. They never reached production.

## What changed on 2026-11-17

- **A shared artifact is one artifact, not a copy and not a read-only view.** Every member of the agent with a role on it sees it, and an Editor can have it changed; the change is a new version everyone sees. Being a signed-in Gendox user and a member of the agent is required. Sharing with one person outside the agent, and shares that stay at one version, go. (Roles came on 2026-11-24.)
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
| `ARTIFACT_READ_ONLY` | a change to an artifact the conversation was opened on, by someone below Editor |

**Identity is the server's id, not a name the model invents.** The id comes back in the tool result, which is in the history the model sees.

**The tools reach the calling message's thread, and the artifacts it was opened on.** An artifact made in the conversation is reached as in phase 1. One the conversation was opened on (*Change it in a chat*) is checked on every call against the role of the person whose turn it is — the author of the thread's last user message, since a tool runs with no signed-in user: Viewer and up to read it, Editor and up to change it. Without the role the artifact is out of reach, the same as one that does not exist; with too low a role the tool answers `ARTIFACT_READ_ONLY` and the agent tells the user that the owner can give them the Editor role (see *Shared artifacts*).

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

**A conversation opened on an artifact gets the skill from the library**, whether or not the agent has it, as the agent platform work gives `gendox-files` to a conversation with attached files: `SkillService.getCompletionSkills` adds the contextual skills (`gendox-assistant` from a Gendox page, `artifacts` when the thread is linked to an artifact). The skill has a section on the `./artifacts` listing: the artifact is not in the conversation's history, read it before changing it, and the role says what is allowed.

Task-shaped guidance lives inside this skill rather than in skills of its own (decided 2026-11-17): *Info card* is a section of it — when the user asks for a card, its shape and template — and the skill carries `advanced_search` and `read_document` in its `allowed-tools`, so that a card about a document can read it (done 2026-11-24). *Report with a chart*, with the libraries after phase 6, is added the same way. An agent has one skill to add for every kind of artifact.

### Storage — built

One idempotent migration, `V20261113_123000__Add_artifacts.sql`:

- the four `ARTIFACT_TYPE` rows in `gendox_core.types`;
- **`artifacts`** — `id`, `thread_id` (cascade), `project_id` (cascade), `title`, `artifact_type_id` (references `types`), `code_language`, `latest_version`, and the audit columns; indexed on `thread_id`;
- **`artifact_versions`** — `id`, `artifact_id` (cascade), `version`, `content` (text), `message_id` (set null if the message goes), `created_at`, `created_by`; unique on `(artifact_id, version)`, indexed on `artifact_id`;
- `subscription_plans.artifacts_enabled`, boolean, default `true`.

**First-class tables rather than reading artifacts out of `message.tool_calls`**: an edit has no full content in its message, a thread's list would mean scanning every message, and phases 4 and 5 need a row to hang state and sharing on.

**`latest_version` is the number, not a reference to the version row.** A reference would be circular with `artifact_versions.artifact_id` (a nullable column or a deferrable constraint, neither used elsewhere), and the number is what the model, the API and the UI speak of and what the next version is counted from. The unique `(artifact_id, version)` index makes reading the latest one lookup. Only `ArtifactService` raises it, in the transaction that adds the version.

**A version never changes.** The entity marks every column `updatable = false`; a version has no update audit columns.

**Sharing, as built on 2026-11-24**, is a second idempotent migration, `V20261123_120000__Share_artifacts_with_roles.sql`: the `ARTIFACT_ROLE` types (`VIEW`, `INTERACT`, `EDIT`); on `artifacts`, `owner_id` (filled for existing rows from the conversation), `general_access_role_id` (references `types`, null for none), and `public_id`, `public_at`, `public_by`; **`artifact_members`** — the artifact (cascade), the user, the role, and who and when, unique on `(artifact_id, user_id)`; and **`artifact_threads`** — the artifact (cascade), a conversation opened on it, who and when, unique on the pair. Neither new table has a foreign key to users or threads (see *Ready to become a service*).

**Versions are numbered under a row lock.** `ArtifactRepository.lockById` takes the artifact `PESSIMISTIC_WRITE`, as `CompletionTurnRepository` does, so two updates of one artifact in the same answer are numbered one after the other; the unique index is the backstop.

**The version list never loads content.** `ArtifactVersionRepository.findSummariesByArtifactId` selects number, message, date and who made it into `ArtifactVersionSummaryDTO`; the names are filled for the whole list in one query. The artifact DTOs are in `model/dtos/artifacts/`.

### REST surface — built

`ArtifactController`, read-only, nested under the thread. Every lookup includes the thread, so an artifact of another thread is `404`. Responses are DTOs (`ArtifactSummaryDTO`, `ArtifactDTO`), with the type as the `Type` object, as other DTOs show types.

| method | path | returns |
| --- | --- | --- |
| `GET` | `…/threads/{threadId}/artifacts` | the thread's artifacts, oldest first, without content |
| `GET` | `…/threads/{threadId}/artifacts/{artifactId}` | the artifact, its versions (number, message, date), and the latest content |
| `GET` | `…/threads/{threadId}/artifacts/{artifactId}/versions/{version}` | the same, with that version's content |

There is no write endpoint in phase 1: artifacts are made by the agent, and a user's change goes through the chat.

The thread's endpoints carry the reader's role (`yourRole`, null for a reader with none, as on a public thread), and the conversation the artifact was made in (`threadId`) only when it is the one being read or the reader is the owner.

**Added with shared artifacts (2026-11-24)**, all for a signed-in person only (`SecurityUtils.isSignedInPerson`: not an API key, not an agent), with access decided per artifact by role:

| method | path | who | does |
| --- | --- | --- | --- |
| `GET` | `…/artifacts/{artifactId}` and `…/versions/{version}` | any role | the artifact by its id, with `yourRole`; its conversation only for the owner |
| `GET` | `…/artifacts/{artifactId}/sharing` | any role | the owner, the general access role, the people invited with their roles |
| `PUT` | `…/sharing/general-access` | owner | every member of the agent's role, or none |
| `PUT` / `DELETE` | `…/sharing/members/{userId}` | owner | invite a member of the agent with a role, change it, take it away |
| `POST` / `DELETE` | `…/sharing/public` | owner | make it public (a new `publicId` each time) or private |
| `DELETE` | `…/artifacts/{artifactId}` | owner | delete it for everyone |
| `POST` | `…/artifacts/{artifactId}/chats` | Editor and up | *Change it in a chat*: a new conversation of the user's, linked to the artifact |

No role is `404` (`ARTIFACT_NOT_FOUND`), the same as an artifact that does not exist; too low a role is `403` (`ARTIFACT_ROLE_TOO_LOW`). Bodies are DTOs (`ArtifactSharingDTO`, `ArtifactRoleRequestDTO`, `ArtifactChatResponseDTO`).

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

### Shared artifacts — built 2026-11-24

**Roles, as Claude's artifacts have them.** Everyone with a role must be a member of the artifact's agent; someone who leaves the agent loses every role there. People outside the agent do not see it; people outside the organization wait for the public page.

| role | may |
| --- | --- |
| **Viewer** (`VIEW`) | see it, its versions and who has access |
| **Contributor** (`INTERACT`) | also use it: what they do inside it is kept as its data (see *Artifact data*) |
| **Editor** (`EDIT`) | also change it with the agent, in a conversation of their own |
| **Owner** | the person who made it (`artifacts.owner_id`); also share it, make it public, delete it |

- **General access** gives every member of the agent, now and later, one role, or none. **Invitations** give named members of the agent a role each. A person's role is the higher of the two; the owner is always Owner. `ArtifactAccessService` is the one place that decides (see *Ready to become a service*).
- Re-inviting someone changes their role on the same row; the owner cannot be invited.
- Admins of the agent get no rights over others' artifacts for now.

**A change is made in a conversation of one's own, on the same artifact.** An Editor who is not the owner opens it and chooses *Change it in a chat*: a new conversation of theirs starts, linked to the artifact in `artifact_threads`, named after it. No copy is made, and nobody else sees the conversation. Every version records who made it, and the panel shows the name beside it; nobody but the owner sees the conversation it was made in.

**How the agent learns about it.** No made-up tool calls in the history (some providers sign them). On each turn `ChatTemplateAuthor` adds one session item, `OPENED_ARTIFACTS`, after the message's own, in the files listing form of the agent platform work (`FileListing`):

```
./artifacts
./artifacts/Order counter | kind=html | version=2 | role=EDIT | modified=2026-11-23 11:40 | UUID=…
```

- One line per artifact the user still has a role on, with that role, read on every turn: a role taken away removes the line, a lowered one shows. No line, no item: a conversation not opened on an artifact renders exactly as before, so prompt caching holds.
- The title is on one line and the whole item is escaped like every session item, so a title cannot start a line or close the item.
- The conversation gets the artifacts skill from the library (see *The skill*), which explains the listing.

**Two people changing it at once** — decided: no lock. An edit already fails when its `old_text` is not in the latest text, so an edit written against an older reading cannot silently undo someone else's change. A full rewrite (`content`) could: it is to be accepted only when the conversation has read, or itself made, the latest version. **Not built yet.**

**The owner's conversation and the artifact.** Conversations are soft-deleted, so the artifact stays in the database with it. On the owner's Artifacts page, an artifact whose conversation was deleted shows while it is shared with anyone (general access, an invitation or public), and goes with its conversation otherwise.

**Lists.** The owner's *Yours*, and *Shared with you* — the others' artifacts of this agent the user has a role on, each with its owner's name and never their conversation — are the same endpoint, `…/projects/{projectId}/artifacts`, with `sharedWithMe`.

**In the v2 app.**

- **The share dialog**, from *Share* in `ArtifactView`: *Add people from <agent>* (the agent's members who are people, not the owner, not already invited) with a role; *People with access*, the owner and each person invited with their role, changed or removed in place; *General access*, *Only people with access* or *Everyone in <agent>* with one role. Anyone else with a role sees the same dialog read only, as *Who has access*.
- ***Change it in a chat*** in `ArtifactView`, for an Editor who is not the owner, where there is no composer at hand. It opens the new conversation in the agent home with *Change "<title>": * in the composer, unsent, and the artifact beside it, loaded by its id (the conversation's own endpoint answers only after its first message, since the tools need a turn's author). There it offers no second *Change it in a chat*.
- The agent home keeps its windows per person, so another who signs in on the same browser does not find the previous person's conversations open.

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
- **Who may write** — decided, with the roles of 2026-11-24: a Viewer reads shared documents, a Contributor and up also writes them; a private document is read and written only by its user. Documents are shared by default, and the artifact chooses a private one by writing it with `private: true` (or under `users/<id>`, as the skill teaches). Finer rules per collection, as Claude has (e.g. "everyone reads, each writes only their own"), come later, in the declaration of `capabilities`, without changing the table.
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

### Inline artifacts — built 2026-11-24, except the user's switch

**Some artifacts are part of the answer, not an attachment to it.** Asked for "a euro to dollar calculator", the answer can *be* the calculator: it renders in the flow of the text, with no card header, no frame border and no *Open* button in the way, sized to its content.

- `create_artifact` gains `display`: `card` (as today) or `inline`. The skill says when: `inline` for something small and interactive that answers the question in place — a converter, a calculator, a short table or chart, a few controls; `card` for anything long, anything the user is likely to keep, change or share, and every document.
- An inline artifact is still an artifact: it has versions, it is listed in the conversation and on the Artifacts page, it can be shared. Hovering it (or a small control under it on touch screens) offers *Open*, which shows it in the panel as any other.
- The display is stored on the artifact; a later version keeps it unless the agent changes it. `ui/request-display-mode` of phase 3 lets an app ask to move between the two while it runs.
- An inline artifact runs in the same sealed frame. Only its chrome changes.
- **As built:** `artifacts.display_id`, an `ARTIFACT_DISPLAY` type (`CARD`, `INLINE`; null is a card), in the migration `V20261124_163000__Artifact_display_and_info_card.sql`; `display` on both tools, returned in their results and in the DTOs; the skill's *Card or inline* section. In the chat the thread's latest create or update result decides how an artifact shows, with no request; an inline one sizes to its content and has a small *Open* under it, not on hover, since a frame takes the pointer's hover.
- **The user can switch it** — decided, **not built yet**: *Show as a card* / *Show inline* in the artifact's menu. It changes how it is shown, not its code, so it makes no version and needs no agent. It is stored on the artifact, so everyone who sees a shared artifact sees the same.

### Sizes — 2026-11-17, built 2026-11-24

What was built is too tight: the card's preview stops at a fixed small height, and in the panel or a small dock tab an artifact that is taller than the space is cut off with no way to reach its lower part (a game whose start button sits below the fold). The rules from now on:

- **Nothing is ever cut without a way to reach it.** Where an artifact is taller than its space, the space scrolls.
- **The card and inline artifacts** grow with their content (the frame already reports its height) up to a generous maximum, about the height of the window; beyond it the frame scrolls inside, and *Open* shows it whole.
- **The panel and the dock tab** give the frame the larger of the space available and the height the content reports, inside a scrolling area; a maximized tab gets the whole window.
- **The skill** tells the agent that an artifact may be shown small: no layout that depends on the full window height (`100vh`) for its controls, the main controls near the top, and the page allowed to scroll.
- **As built:** `ArtifactFrame` grows a panel's frame to the height its content reports and lets the space around it scroll; content sized by the frame's own height (`100vh` and a margin) goes past it by the same amount however tall it gets, and the frame stops growing when it sees that. Verified in Chrome with a 60-row page whose button is at the bottom, and a `min-height: 100vh` page that grew once and stopped.

### Public links — designed 2026-11-17, not built

**Decided:** artifacts can be opened by people without an account, read only, through a link, at an address outside `/gendox/`. The owner chooses whether an artifact is public; it is not by default. **Built so far (2026-11-24):** the public state on the artifact and the owner's endpoints to make it public and private. The page, its read endpoint, the organization's setting and the plan column are still to build.

- **The address.** `/a/{publicId}` shows the latest version; `/a/{publicId}/v/{version}` one version, which never changes. (The application is a static export, so the page is a single route that reads the rest of the address; the server sends every `/a/…` path to it.) The agent and the organization are not in the address.
- **`publicId` is a random id of its own**, not the artifact's id: making an artifact private ends every link at once, and making it public again gives a new link, so an old one does not come back to life. The artifact's internal id is never exposed.
- **What a public reader gets:** the artifact in the same sealed frame, its title and kind, the agent's name, copy and download — never the conversation, the organization or its members, its other versions (unless the link names one) or the names of who made it or wrote its data. `use('user')` and `use('data')` answer `null`.
- **Who may make it public:** the owner. Taking every role away in the agent does not by itself make it private.
- **The organization can turn them off** — decided: a setting of the organization, on by default, changed by its admins. Off, every public link of the organization answers as not found at once, without forgetting which artifacts were public, so turning it on again brings the same links back. Whether a plan includes public links is a plan column, as for artifacts themselves.
- **Shared data, read only, when the owner says so** — decided on 2026-11-17, **dropped while building (2026-11-23)**: a public reader gets the artifact only. If it is asked for, it comes back as a column on the artifact and a second choice when making it public, with private documents never shown and no names.
- **The page names the agent** — decided: "Made by the AI agent <agent name> on Gendox", with the sealed-frame note. Not the organization, not the person who made it.
- **Backend:** a public state on the artifact (the `publicId`, by whom, when) and `POST` / `DELETE` to make it public or private, for the owner — **built**; and one read endpoint, still to build, `GET …/public/artifacts/{publicId}` (and `…/versions/{version}`), named one by one in the security configuration for `GET` without a login, never with a wildcard. It returns only what a public reader gets, as a DTO of its own.
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

Built in this order, each a commit of its own: the cheaper history, the Artifacts page and the conversation's list, the *Info card* skill, *Try to fix*, and sharing last, since it adds a section to the Artifacts page (all **built**). Sharing was then rebuilt as shared artifacts with roles (built 2026-11-24); their data comes next (see below). Libraries, `MERMAID` and *Report with a chart* moved after phase 6 (see *After the phases*): nothing in phases 2 to 6 needs them, and an artifact can already draw a chart in SVG or plain script.

- The task-shaped skill *Info card*.
  - **Built.** `resources/skills/info-card/SKILL.md`, imported into the library on startup like the other system skills; an admin adds it to an agent. No migration and no code: the artifact tools come with the skill's `allowed-tools`, and plan gating reads tools, not skill names.
  - `allowed-tools: create_artifact, update_artifact, read_artifact, advanced_search, read_document` — a card about one document reads all of it, not only what search returns.
  - The skill fixes the card's shape (title and what it is, four to eight key facts, a summary of at most three sentences, an optional *Watch out*, the sources) and gives a short HTML template that follows the theme variables and needs no script, so cards look alike and stay small. Only what the documents say goes on a card; a missing fact is left out. It stands on its own, so an agent can have it without the general artifacts skill.
  - Verified with Gemini on a real document.
  - **Moved into the artifacts skill (2026-11-24).** Its shape and template are the *Info cards* section of `resources/skills/artifacts/SKILL.md`, whose description now names cards and whose `allowed-tools` gained `advanced_search` and `read_document`. The `info-card` folder is removed. The startup importer does not remove a skill that is no longer shipped, so the idempotent migration `V20261124_163000__Artifact_display_and_info_card.sql` (which also adds the display of *Inline artifacts*) gives every agent with the library's *Info card* the artifacts skill (unless it has it), takes *Info card* off them — an agent's own skill of the same name is left alone — and marks it deleted in the library. The migration copies the library's current artifacts skill; the importer then publishes the new one and moves every copy to it. Verified in the ephemeral environment with the three cases, and run twice.
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
- **Sharing inside the organization, as first built** — read-only shares with two audiences (everyone in the agent, or one member of the organization), each following the latest version or one chosen, with a reader's page of its own. Built and verified, then **removed (2026-11-23/24)** with its table, endpoints, page and dialog, before it reached production: shared artifacts replace it.
- ***Continue in a chat* — dropped.** It copied a shared artifact into a new conversation of the reader's, which forked it. What carried over is the way the agent learns about an artifact that is not in its history: a session item added per turn.
- **Shared artifacts — built** (see *Shared artifacts* in *Decisions*):
  - Backend: the migration of 2026-11-24; `ArtifactAccessService` (the role, and `require`); `ArtifactSharingService` and `ArtifactSharingController` (sharing, public, delete, *Change it in a chat*); reading by id with `yourRole` in `ArtifactController`; the lists' *Yours* and *Shared with you* in `ArtifactPredicates`; the tools' wider reach in `ArtifactService.checkReach`; the `./artifacts` listing (`ArtifactService.openedArtifactsListing`, `ChatTemplateAuthor`, `FileListing` taken as is from the agent platform work); the contextual artifacts skill in `SkillService`.
  - Frontend: the share dialog, *Shared with you*, opening by id, *Change it in a chat* with the artifact beside the new conversation, the agent home's windows per person. The read-only reader page, its link and its list are gone.
  - **Not built yet:** the rewrite rule for two people changing it at once; *Restore this version*.
  - Verified by unit tests (the access rules, the sharing service, the predicates, the controller's role and conversation rules, the listing and its session item, the contextual skill), in the ephemeral environment through the API with four users (roles given, changed and taken away; `404` and `403`; the lists; a deleted conversation), with the mock model (what the model receives: the listing with the owner's role, a lowered role, no listing once the role is gone, none in an ordinary chat), and in the app's browser pane with two users (the dialog as owner and read only, *Shared with you*, *Change it in a chat*). The frame itself cannot render in the pane (see *Verification*).
- **Artifact data** (after shared artifacts; see *Artifact data* in *Decisions*):
  - Backend: `artifact_data`, its service and endpoints, `capabilities` on the artifact and on the two tools, and optionally `read_artifact_data`.
  - Frontend: the `gendox.use` script in the shell, the `gendox/data/*` and `gendox/user/*` methods in the host with their checks, polling while open.
  - The skill: the data API and its rules.
- **The output floor on the agent's settings screen**, and the model's maximum output on `ai_models` capping it; **usage by tokens** for artifact turns, with the subscription work.
- **Inline artifacts and sizes** (see *Inline artifacts* and *Sizes* in *Decisions*): `display` on the artifact and on `create_artifact`, and the user's *Show as a card* / *Show inline*; the inline rendering in `ChatTurn`; the new height rules in `ArtifactFrame`, the card, the panel and the dock tab; the skill's guidance on both.
- **Public links** (see *Public links* in *Decisions*): the public state and its endpoints; the organization's setting and the plan column; the owner's *also show its shared data*; the page under `/a/`, outside the application's layout and guard; *Make public* / *Make private* and *Copy public link* for the owner in `ArtifactView`; the server rule that sends `/a/…` to that page in every environment.
- Write endpoints (sharing, data, public links, later editing by hand) require a signed-in user and are never let through the security configuration without a login.
- **An Artifacts page for each agent**, beside Tasks and Knowledge in the agent's menu, as a page and as a dock tab. It lists the user's own artifacts with this agent — never every artifact of the agent: a conversation is personal, and its artifacts are shown to others only by sharing. A second tab, *Shared with you*, lists the others' artifacts of this agent the user has a role on.
  - Backend: `GET …/organizations/{organizationId}/projects/{projectId}/artifacts`, without content, paged, newest change first, searchable by title and filtered by type; with `sharedWithMe`, the others' artifacts the user has a role on. It filters rather than refuses, so one artifact out of reach never empties the list.
  - Frontend: a row per artifact with its type, title, version, date and the conversation it came from. A click opens it in `ArtifactView` (the panel, or the artifact tab); a second action opens the conversation.
  - **Built.**
    - Backend: `ArtifactCriteria` and `ArtifactPredicates`, the codebase's criteria-and-predicates pattern. The controller always sets the project from the path and the user from the sign-in, whatever the request says; with either missing the predicate matches nothing. *Yours* is the artifacts the user owns whose conversation is active or which are shared; *Shared with you* is the others' with general access or an invitation for the user, the user being a member of the agent. A page holds at most 100; unsorted, it is the last changed first. The owner's rows carry `threadName`, everyone's `ownerName`, each read for the whole page in one query; another's row carries no conversation.
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
- **Shared artifacts in Chrome**: the frame inside the share and *Shared with you* screens, and beside a conversation opened on an artifact, following a new version made there — the pane could not render the frame, and the mock model never calls the artifact tools.
- **A mock that can be told to emit a given tool call**, so the e2e suite can create an artifact without a provider key. The mock model calls only `advanced_search` today.

## Open questions

**Shared artifacts — decided 2026-11-24, while building** (folded into *Shared artifacts* above): roles as Claude's artifacts have them, replacing "shared with the agent, maybe locked"; the owner a column; invitations a table of their own; no change to `thread_id`, since conversations are soft-deleted; the `./artifacts` listing and the contextual artifacts skill; the public reader's view of shared data dropped.

**Shared artifacts and their data — decided 2026-11-17** (still true unless the line above changed it): data shared by default, the artifact choosing a private document; two people changing it at once with no lock; the owner alone deletes; a single write rule now, per-collection rules later; the work stays under #570.

**Decided later the same day:** public links on by default with an organization setting to turn them off; the public page names the agent; the user can switch inline and card; versions are never deleted, only restored; editing by hand later; interactive artifacts in the widget behind a per-agent setting, off by default. Each is written into its section above.

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
- **A tool runs with no signed-in user.** Whose turn it is comes from the thread's last user message; a check of a person's role inside a tool reads it from there.
- **The `./artifacts` listing is in the files listing form of the agent platform work** (`FileListing`, taken as is). When the two lines of work meet, the session items are one `Stream.of(…)` with both the attached files and the opened artifacts.
- **The MCP Apps specification** is in the `modelcontextprotocol/ext-apps` repository; check the bridge against it before phase 3, since it is the contract being adopted.
