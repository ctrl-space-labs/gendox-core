# Gendox as an agentic platform — roadmap

2026-11-10, revised the same day after the first review (decisions D1–D7, ticket status, decision-support idea, core rules).
Branch reviewed: `feature-frontend-v2-redesign` (backend 0.13.0, `gendox-frontend-v2`).

**Architecture map with the tasks linked to each part:** https://claude.ai/artifact/NiR6dwBPTU4icrXbtVay9Z (private; shared from the page's Share menu)

Goal: turn Gendox from "an agent that answers from documents" into an agent that **works**: connected to the
organization's apps, reachable from the places people already talk, able to run code and produce files, and safe
enough for enterprise use. Decision support is the reference scenario: it is not a separate product but one level
above these features — visualization, triggers and many skill files. It gets **one** ticket (section 8); everything
else here is a primitive it reuses.

**Status, 2026-11-17:** CORE-1 through CORE-4 (#579), SRCH-1 and SRCH-3 (#550, #559) are implemented. SEC-1 is
implemented and in review. PACK-1 is partly implemented: agent definitions export as JSON or YAML; import and
connection requirements remain pending. Other roadmap tasks remain pending. Each workstream gets its own plan file in
`.ai/` before code is written.

This status reflects committed code on `feature-agent-platform-roadmap`; uncommitted changes are not counted. "Done" below means implemented, with the remaining validation stated separately; it does not imply a
release or that the corresponding GitHub issue is closed.

| Task | State | Commit evidence |
|---|---|---|
| CORE-1 … CORE-4 | Done (2026-11-11) | `36b77d20` (loop tests), `dff7944a` (runtime resolver), `9f8839bd` (tool execution and unknown-tool result). |
| SRCH-1 | Done (2026-11-14) | `8fd48244`, `7fa123ef`, `ae3f8083`: thread file listings, automatic `gendox-files` skill, document-tool access, `list_files`, `view_page` and sub-agent file context. |
| SRCH-3 | Done (2026-11-14) | `8fd48244`, `7fa123ef`, `ae3f8083`: modified time and line ranges in search hits, file metadata in section templates, and the updated date on v2 citations. |
| PACK-1 | Partial (2026-11-12) | `0ba53f4e`, `fd2cf34b`, `7a2986fa`: JSON/YAML export, v2 preview and download, YAML string preservation and Jackson 3 compatibility. Import and connection requirements remain pending. |

Validation of SRCH-1 and SRCH-3 (#550, #559): unit tests and mock-model API checks cover
the file listing and search-hit format. Real-model `view_page`, Document Insights with supporting files, the v2
citation date and direct uploaded-file checks for `regex_search` / `extract_relevant_sections` remain to be verified.
This roadmap update reviews commits and code; it does not add a new test run.

---

## 1. Where Gendox is today

Checked in code and in the running `local-development-test` stack with the v2 frontend.

| Area | What exists |
|---|---|
| **Completion core** | `CompletionService.getCompletion`: resolve context → moderation → history → loop (model call → audit → save → run tools → continue or wait). One path for JSON, SSE, deep thinking, task runs and sub-agents. |
| **Extension seams** | `CompletionRuntimeOverridesDTO` (what a caller changes), `CompletionListener` (who is listening), `AiToolRegistry` / `AiToolHandler` (tools that run in Gendox), `SkillService` (skills and the tools they bring), `CompletionTurn` (a turn that waits and resumes). |
| **Tools** | Run in Gendox: `advanced_search`, `read_document`, `regex_search`, `list_files`, `view_page`, `diff_documents`, `summarize`, `extract_relevant_sections`, `create_sub_agent`, 11 task tools, `read_skill`. Run on the client: `ACTION` (async) and `CLIENT` (sync, the turn waits). User-declared tools are JSON schemas on the agent and can only run on the client. |
| **Record of a turn** | Every assistant message, tool call and tool result is saved as a message in the thread. |
| **Skills** | `SKILL.md` with `allowed-tools`, a system library, per-agent copies, `read_skill` on demand. System skills: `gendox-assistant` and `gendox-files`; the latter attaches automatically when the thread has files. A skill may list built-in tools only. |
| **Knowledge** | Upload, write, crawled websites, WordPress, Git, S3, API integration. Google Drive and Dropbox exist as type names only. Search mode `ALWAYS` / `AUTO` / `OFF`, rerank, sources on answers. Thread uploads are listed in context and read through tools without embeddings; search hits include line ranges and modified time, and v2 citations show the updated date. |
| **Agent definitions** | JSON/YAML export of behaviour, named models, settings, chat settings, tools and skills, with preview and download in v2. Import and connection requirements are pending (PACK-1). |
| **Tasks** | Document Insights, Digitization, Earth Observation; deep thinking as a Spring Batch job. |
| **Channels** | v2 web app (agent home is a dock of tabbed windows; its layout is kept in the browser), chat on every page, white-label widget with host-page tools, WordPress plugin, REST API with API keys, Python SDK. Discord exists but is poorly implemented and tested: not a base to build on. |
| **Org services** | `organization_connectors`, one row per organization and type: Google Earth Engine, Firecrawl. Model provider keys per organization. |
| **Governance** | Organizations, projects, roles, `@PreAuthorize`, API keys, rate limits, moderation, `audit_logs` with token counts, plans and limits. |
| **Sandbox precedent** | `public/gee-sandbox/gee-sandbox.html`: an iframe with a strict CSP that runs model-written Earth Engine code. |

Ticket status from the original review, with implementation updates from the commits above (issue closure has not
been rechecked):

- **Done:** #519, #518, #493, #525, #503, #548, #549, #452, #521, #512, #527, #562, #542, #529.
- **Implemented since review:** #559 / #550 attached documents (SRCH-1; validation limits above).
- **Split export/import work:** #554 export is implemented; import is tracked separately in [#567](https://github.com/ctrl-space-labs/gendox-core/issues/567), open and assigned to `gyfantidis` as of 2026-11-14. PACK-1 remains partial; connection requirements are additional roadmap scope, not part of #567.
- **Pending and used below:** #522 browser code execution, #523 artifacts, #524 document generation, #528 speech, #530 MCP, #531 usage, #532 plugin architecture and adapters, #555 unanswered questions, #558 ask before running a tool, #561 API keys, #563 visitor conversations, #564 search, #484 roles.

One gap found while reading the code: the chat inside the Gendox app does not answer `CLIENT` tool calls itself; only the embedded widget does, through its host page. Several features below need the app to do it (task APP-1).

## 2. What agent products offer

Looked at: Meta Muse, xAI Grok Bot and Team Bots, ChatGPT Enterprise, Claude, Microsoft 365 Copilot, Glean, Manus.

| Capability | Common in the market | Gendox today |
|---|---|---|
| Connectors to work apps | Yes, the headline feature | No |
| Custom connectors (MCP, or an API the user supplies) | Yes | Client-side tools only |
| Approval before anything is sent, published or spent | Yes | No (#558) |
| Agent inside Slack / Teams with its own handle | Yes, Slack first | Discord, poorly |
| Code execution, hosted VM or local | Yes | No (#522) |
| Artifacts and files (docx, xlsx, pptx, pdf, html) | Yes | No (#523, #524) |
| Scheduled and triggered runs, notifications | Yes | Integration schedules only |
| Shared skills, memory | Yes | Skills only |
| Admin view of what agents did, usage | Yes | Partly |
| Agent templates | Yes | Partial: JSON/YAML definition export (#554); import pending (#567) |
| Voice | Some | No (#528) |
| Computer use | Muse, Manus | Not planned |

Where Gendox is already ahead and should stay ahead: the widget with host-page tools (agentic websites), document
intelligence on scanned documents, batch document tasks, and a provider-neutral core that also runs local models.

## 3. Decision support: the scenario that defines the primitives

How it is meant to work, using only features an enterprise agent needs anyway:

1. **A data source is connected** to the agent: SharePoint, Google Drive, a mailbox, an MCP server, an API.
2. **The agent learns the source and writes a skill.** The first time it uses a source it explores it, then saves a small skill file: what the source is, how to query it, which fields matter, units, how fresh it is.
3. **Boards appear in the workspace.** The agent proposes, or a user asks for, a data visualization board. Boards sit side by side in the workspace so operators review them together.
4. **A controller agent monitors.** It runs on a schedule or when a source changes, and reads the sources with their skills.
5. **It draws attention.** It flags the board that matters most, opens a new feed in the workspace, and notifies people.
6. **Operators act through the chat.** They ask; the agent acts with MCP or APIs, after approval.

The primitives this needs, each useful on its own:

| Step | Primitive | Workstream |
|---|---|---|
| 1 | Connections owned by the organization or the project | CONNECT |
| 1 | Tools from MCP servers and from declared HTTP calls | MCP-CLIENT, HTTP-TOOLS |
| 2 | A skill the agent writes; skills that list connector tools | SKILLS |
| 3 | Artifacts; a board is an artifact bound to a stored tool call that refreshes | ARTIFACTS, BOARDS |
| 3 | A workspace layout shared by the people of an agent | BOARDS |
| 4 | Scheduled and triggered runs | RUNS |
| 5 | Workspace tools (open, focus, flag for attention); notifications | BOARDS, RUNS |
| 6 | Approval before a tool runs | APPROVAL |

## 4. Protecting the core

The application is minimal, clean and readable today, and that is the property to keep. `CompletionService.getCompletion`
stays the one place a completion runs, readable from top to bottom.

Every new capability should be one of five things, outside the loop:

| It is a… | It plugs into | Examples |
|---|---|---|
| **Tool** | The tool engine | MCP tools, HTTP tools, `run_code`, `create_artifact`, `write_skill` |
| **Skill** | `SkillService` | Contract review, a data-source skill, briefing format |
| **Channel** | `POST messages/completions` and a `CompletionListener` | Slack, Teams, email, widget, desktop shell |
| **Trigger** | Starts a run from a stored message | Schedule, webhook, new document, source changed |
| **Policy** | The one check before a tool runs | Requires approval, not allowed for this agent |

Rules:

1. **The core changes only for a strong architectural need**, stated in the plan of the workstream that asks for it. `getCompletion` is not frozen; it is not changed for convenience.
2. **Policy and security checks happen in one place**: where a tool call is about to run. Is this tool allowed here, does it need a yes, which connection does it use.
3. **No second record of tool calls.** They are already saved as messages, and an approval answer is a message from the person who gave it. Views of "what the agent did" read the messages.
4. No provider, channel or feature names inside the loop.
5. The loop knows two outcomes of a tool call: a result (continue) or pending (save the turn and stop).
6. **No seam before its first user.** A new interface is added by the first workstream that needs it, as the smallest change that works.

How changes are made: get it working on a branch, then iterate until the diff is minimal, then review. A pull request
that touches a core file says which and why.

### Workstream CORE

One owner, in series, reviewed line by line. Deliberately small. Done: #579 (implemented in the order CORE-1, CORE-3, CORE-2, CORE-4).

| Task | What | Why |
|---|---|---|
| CORE-1 | Tests that pin down the loop with the mock model: plain answer, tool round, client wait and resume, iteration limit, cancel, skills, search modes. | Everything after this changes code these tests protect. |
| CORE-2 | Tool execution moves out of `CompletionService` into one class, which is also the single place for the policy and security check. Per call it returns a result or pending. | Decision D5. Approval, MCP and code execution hook here instead of into the loop. |
| CORE-3 | The `resolve*` family moves into a runtime-context resolver; the loop file keeps the loop and the chat entry points. | Decision D5. The file is 966 lines; the loop is about 150. |
| CORE-4 | A tool name the model invents returns an error result to the model instead of ending the turn. | More tools from more sources make this common. |

**Done on 2026-11-11.** `CompletionService` went from 966 to 533 lines. The runtime context is resolved by
`CompletionRuntimeContextResolver`, tool calls run through `ToolExecutionService`, and 25 loop tests pin the behaviour.
The only behaviour change is CORE-4. Details and verification are in the plan.

Left out on purpose until a workstream needs them: a tool-source interface (MCP-CLIENT adds it), an explicit run mode
replacing "a cancellation token means deep thinking" (RUNS adds it), a token budget for history and oversized tool
results (added when tool-heavy turns show the need).

## 5. Workstreams

New screens are in `gendox-frontend-v2` only. Task ids match the architecture map.

### APP — the in-app chat runs client tools

- **APP-1.** The chat in the app answers `CLIENT` tool calls itself, with a small registry: tool name → handler, tool name → card. Today only the widget's host page answers them. Needed by code execution, workspace tools and approval cards.
- Carried over from the streaming chat plan (#519 / #518 / #542), which is implemented and whose file is removed:
  - **Timeout per tool.** The backend sets no deadline for a waiting call; a client that gives up posts an error result. How a tool developer sets that timeout is not designed yet. Decided in the APP-1 plan.
  - **One name for registering a handler.** The widget has `window.gendox.tools.registerTool(name, fn)`; the redesign shows `GendoxChat.onTool(name, fn)`. APP-1 picks one.
  - **Not yet verified on a running stack:** a `CLIENT` tool that waits and resumes (unit tests only), and streaming with a real provider other than OpenAI. Check both with the live env when APP-1 is built.

### APPROVAL — ask before a tool runs (#558)

- **APPR-1 Backend.** `ai_tools.requires_approval`; a pending call waiting for a yes; the answer is a `role: "tool"` message on the existing endpoint; a declined call gives the model "declined by the user". Checked in the CORE-2 class. Waits for CORE-2.
- **APPR-2 v2.** "Ask before running" switch on Agent → Tools; an approval card in chat and widget with the tool and its arguments in readable form. Waits for APPR-1, APP-1.
- Later: "allow for this conversation".

### CONNECT — connections to work apps

Decision D2: **a connection belongs to the organization, and a project may override it. Never to a user.** Everyone who
can talk to an agent uses the agent's connections; who may talk to the agent is the access control. An agent with
sensitive connections should be private; Deploy shows a warning when a public agent has connections that can act.

- **CONN-1 Connections.** Extend `organization_connectors` rather than add a table: an optional `project_id`, a `name` (several of one type, e.g. two MCP servers), credentials stored encrypted. Lookup: the project's, then the organization's. OAuth authorization-code flow with refresh.
- **CONN-2 Knowledge sync.** Google Drive, SharePoint and OneDrive on the existing `IntegrationUpdateService` contract. Synced documents belong to the agent; whoever has access to the agent has access to them (decision D6).
- **CONN-3 Live tools.** Google Workspace (Drive, Gmail, Calendar), Microsoft 365 (SharePoint, Outlook, Teams), Slack, and a mailbox for an agent: search, read, act. Through MCP (decision D1). Tools that act default to "ask". Waits for MCP-1, APPR-1.
- **v2:** Organization → Connected services: connect and disconnect; Agent → Connections: use the organization's or override.

### MCP-CLIENT — connect an agent to MCP servers (#530)

- **MCP-1 Backend.** An MCP server is a connection of type MCP server. Its tools are listed, cached and offered to the agents it is linked to, with names prefixed by the server. Per-server choice of tools; tools that are not read-only default to "ask". This workstream adds the tool-source interface. Waits for CORE-2, CONN-1.
- **MCP-2 v2.** Add a server, see and switch its tools; Agent → Tools shows "From connected services".
- **Trust model, before implementation:** descriptions and results from a third-party server are untrusted text. Requirement: a server cannot change what other tools do or reach another connection's credentials. Specifics belong in the private tracker.
- Check first whether Spring AI's MCP client (1.0.3 in use) fits, or the MCP Java SDK directly.

### HTTP-TOOLS — a declared tool that Gendox calls

- **HTTP-1.** A third way a declared tool runs: Gendox calls an API. Method, URL template, headers, body template, the connection that authenticates it, size limit and timeout. Outbound calls go through one client that cannot reach internal addresses. Waits for CORE-2, CONN-1.
- **HTTP-2.** Import tools from an OpenAPI document.
- **v2:** "Runs in Gendox · calls your API" in the Add tool dialog, with "Try it".

### SKILLS — skills the agent writes

- **SKILL-1 `write_skill`.** The agent creates or updates a skill on its own agent. Used when it meets a new data source: one skill per source. Asks for approval by default; the skill is visible and editable in Agent → Skills like any custom skill.
- **SKILL-2.** A skill may list connector tools (MCP and HTTP) in `allowed-tools`; today only built-in tools pass validation.

### CODE — code execution

Two tickets, as decided in review:

- **CODE-1 Browser sandbox (#522).** The agent writes JavaScript; it runs in the chat's browser as a `CLIENT` tool, in an iframe with an opaque origin and a CSP that allows no network. No credential enters the box; data goes in and out by message. The Earth Engine sandbox is the precedent. Python through Pyodide is a follow-up. Waits for APP-1.
- **CODE-2 Terminal (new ticket).** The agent runs commands and reads and writes files in a server sandbox (decision D3; requirements in section 7). The tool contract is written so a local runner can implement it later.
  - **Open question:** how a box is isolated. Proposal: containers under gVisor (section 7).
  - **Commands are named tasks.** Every command carries a short description in plain words, written by the agent. A command can run in the background while the turn continues, and can be stopped.
  - **v2:** the workspace lists running and finished commands, under the name "Commands", with the description, the duration and a stop button; opening one shows the command, its output and the exit code.
- **CODE-3 Local terminal in a desktop shell.** Later (decision D4). The shell registers the CODE-2 tools as `CLIENT` tools; every command asks.

### ARTIFACTS — rendered output and files (#523, #524)

- **ART-1 Backend.** Artifacts with versions on a thread (html, markdown, csv, svg; binary files in S3); tools `create_artifact`, `update_artifact`, `read_artifact`.
- **ART-2 v2.** An artifact opens as a workspace tab beside the chat; html renders in the CODE-1 sandbox; inline in the widget. Waits for ART-1, CODE-1.
- **ART-3 Document generation (#524).** docx, xlsx, pptx, pdf, with a skill per format. Runs in the terminal (CODE-2); backend templates with the libraries already used for parsing are the fallback for simple formats.

### BOARDS — live views in a shared workspace

- **BOARD-1 Boards.** A board is an artifact bound to a stored tool call (MCP, HTTP, search) with a refresh interval. Gendox re-runs the call without the model and the board redraws. Tools: `create_board`, `update_board`. Waits for ART-2 and a tool source (MCP-1 or HTTP-1).
- **BOARD-2 Shared workspace.** The workspace layout of an agent is saved on the server, so its people see the same boards. Today it is kept per browser.
- **BOARD-3 Workspace tools.** Client tools the app handles: open a board or document in the workspace, bring one to the front, flag one for attention with a reason. Waits for APP-1.

### RUNS — scheduled and triggered work

- **RUN-1 Scheduled runs.** An agent run: prompt, schedule, last and next run, status. A run is a turn in its own thread. Adds the explicit run mode to the overrides. A tool that needs approval pauses the run and notifies.
- **RUN-2 Triggers.** Webhook, new document, and "source changed": a stored tool call polled on an interval, starting a run when its result changes or meets a condition.
- **RUN-3 Notifications.** In the app (the attention flag of BOARD-3), email, and the channels.
- **v2:** Agent → Automations.

### MEMORY

- **MEM-1 Project memory.** Facts the agent saves with a `remember` tool, visible and editable by project admins, added to the system prompt as a stable block. No per-user memory for now, in line with D2.

### CHANNELS — the agent where people talk (#532)

The Discord bot is not the model to extract from. The contract is written with Slack as its first implementation.

- **CHAN-1 Channel contract and Slack.** An inbound event resolves the agent and the thread, calls the same completion endpoint, renders the answer. A channel says what it can do: streaming, approval buttons, client tools (none: `CLIENT` tools behave as `ACTION`). Slack: mention and direct message, a Slack thread is a chat thread, files become thread documents. Whoever can reach the agent in Slack uses it, in line with D2.
- **CHAN-2 Microsoft Teams.** **CHAN-3 Email:** an address per agent; sender authorization is part of the feature.
- **CHAN-4 Discord** rebuilt on the contract, with tests; the `discord/` package leaves the core.
- **v2:** Deploy gains Slack, Teams and Email.

### SEARCH (#564, #559, #550)

SRCH-1 and SRCH-3 are done (#550, #559). The context lists the files; tools read them.
Both are implemented (#550, #559, 2026-11-14); remaining validation is listed at the top of this roadmap.

- **SRCH-1 — Done.** Attached documents reach the model (#559, #550) through a thread-wide file listing and tools. Includes the automatic `gendox-files` skill, `list_files`, `view_page` and file context for sub-agents. Uploads are not embedded or inlined in the prompt.
- **SRCH-2.** #564 as written: metadata filters, markdown chunking, embedding migration.
- **SRCH-3 — Done.** Source time returned by search and shown with the citation: the document's last update (`modified`, also the sync time for a synced file), as agreed in the agent-files plan. Search hits carry numbered text and line ranges; the default section template includes file metadata; v2 citations show the updated date.

### GOVERN (#531, #563, #555, #561, #484)

- **GOV-1 Activity.** "What the agent did" per thread and per organization, read from the saved messages. No new table.
- **GOV-2 Usage** (#531). **GOV-3 Visitor conversations** (#563, #555).
- **GOV-4 Policies.** Which tool sources and connections an organization and an agent may use; enforced in the CORE-2 check.
- **GOV-5.** Several roles per member (#484). The API keys part moved to SEC-1.
- **SEC-1 Secrets at rest.** Every stored secret, API keys included, is encrypted two-way, with a key provider per deployment (environment, AWS KMS, others). Decided on 2026-11-13 in place of "API keys stored as a hash" (#561). Plan: [secrets-at-rest-2026-11-15.md](secrets-at-rest-2026-11-15.md). Implemented, in review. CONN-1 waits for it.

### PACKS (#554 export, #567 import)

- **PACK-1 — Partial.** Export and import an agent: behaviour, model, tools, skills, the connections it needs.
  - **Done:** JSON/YAML definition export, including behaviour, named models, settings, chat settings, tools and skills; v2 preview, copy and download. Commits: `0ba53f4e`, `fd2cf34b`, `7a2986fa` (2026-11-12).
  - **Pending:** import of a definition is tracked in [#567](https://github.com/ctrl-space-labs/gendox-core/issues/567): create a new agent from JSON/YAML, with a preview, model fallback, format-version and plan-limit checks, and transactional creation of its tools and skills. It excludes integrations and updating an existing agent. The file shape is an open decision to settle before import is built, per #554's export comment.
  - **Additional roadmap scope:** declaration of the connections an agent needs. This is not included in #567. PACK-1 as a whole remains open.
- **PACK-2.** Skill packs for the domains Gendox is used in: contract review, financial analysis, historical ship-log digitization, briefing.

### MCP-SERVER (#530)

- **MCPS-1.** Gendox as an MCP server: an agent's search, document reading, tasks and "ask the agent", with API keys.

### Later

- **VOICE-1** (#528): investigation and cost model. Desktop shell (CODE-3). Single sign-on per organization.

## 6. Order

| Phase | Tasks |
|---|---|
| 0 | Done: CORE-1 … CORE-4, SRCH-1, SRCH-3. In review: SEC-1. Pending: APP-1. |
| 1 | APPR-1, APPR-2, CONN-1, MCP-1, MCP-2, CODE-1, ART-1, ART-2, CHAN-1, GOV-1, GOV-2, GOV-3, PACK-1 (export done; import and connection requirements pending) |
| 2 | HTTP-1, HTTP-2, CONN-2, CONN-3, SKILL-1, SKILL-2, BOARD-1, BOARD-2, BOARD-3, RUN-1, RUN-2, RUN-3, MEM-1, CODE-2, ART-3, CHAN-2, CHAN-3, MCPS-1, PACK-2, SRCH-2 |
| 3 | DSS-1, CHAN-4, CODE-3, GOV-4, GOV-5, VOICE-1 |

Where parallel branches would collide:

| Shared surface | Rule |
|---|---|
| `CompletionService`, the tool execution class, `CompletionTurnService` | Only CORE and APPR-1 change them. A later workstream that needs a change states the architectural need in its plan first. |
| `Chat.js`, `ChatTurn.js` | APP-1 adds the handler and card registry in phase 0; cards are then separate files. |
| Agent → Tools, Add tool dialog | APPR-2 first; MCP-2 and HTTP-1 add a section each after it. |
| Organization → Connected services, `organization_connectors` | CONN-1 first; MCP-1 builds on it. |
| Flyway migrations | One per workstream, timestamped the day it merges. |

## 7. Decisions

| | Question | Outcome |
|---|---|---|
| D1 | Extension boundary | **Agreed.** MCP for tools. Native adapters only for transports (Slack, Teams, Discord, mail) and knowledge sync. No plugin SDK. |
| D2 | Whose credentials | **Decided.** The organization's by default; a project may override. No user-level connections. Access to the agent is access to its connections. |
| D3 | Where code runs | **Decided, in two parts.** Browser sandbox for JavaScript (CODE-1). Terminal in a server sandbox first (CODE-2), self-hosted; how a box is isolated is open, with gVisor proposed. A local runner later with the desktop shell (CODE-3). |
| D4 | Desktop shell | **Agreed.** Later. |
| D5 | Split `CompletionService` | **Agreed.** Resolver and tool execution move out; the loop and chat entry points stay. |
| D6 | Access to synced documents | **Agreed.** Ownership sits with the agent; access to the agent is access to its documents. |
| D7 | First connectors | **Agreed.** Google Workspace, Microsoft 365, Slack. |

**D3, the terminal — decided: a server sandbox first, with one tool contract that a local runner can implement later.** Why:

| | Server sandbox | The user's machine |
|---|---|---|
| Works with Slack, Teams, schedules, the monitoring agent | Yes | No: nobody's machine is open |
| Works for every user of an agent | Yes | Only for whoever installed the app |
| Reaches local files and local tools | No | Yes, its real advantage |
| Where the risk sits | With the operator: isolation of untrusted code | With the customer: an agent with a shell on a work computer |
| What it costs | Running a sandbox service | Building and shipping a desktop app |

Triggers, channels and decision support all need a terminal that is there when no one is, which only the server
gives. The requirement for it: a separate runner, never the API's own host; one short-lived box per thread; no
network by default; no Gendox credentials inside; files in and out as artifacts. The local runner then arrives with
the desktop shell as the same tools, run as `CLIENT` tools with a yes per command.

**The runner — open question, answered in the CODE-2 plan. Self-hosted in every case; the proposal is containers
under gVisor.** What the proposal means:

- **The contract.** The API calls a runner service over HTTP with six calls: create a box, run a command, stop it,
  write a file, read a file, delete the box. The API never talks to Docker or Kubernetes, so what is behind the
  runner can change without touching Gendox.
- **Three kinds of container.** The API (unchanged). The runner service: its own container, new in the Compose file.
  The boxes: one container per thread, started by the runner, run under gVisor.
- **Where gVisor is set up.** On the VM that hosts the runner: installed once and registered with that VM's Docker
  as a runtime. It is not part of an image. The runner names it as the runtime of each box; one setting chooses the
  runtime, so a developer machine without gVisor falls back to plain containers.
- **Hosts.** In production the runner and its boxes sit on a VM apart from the API and the database, because the
  runner controls Docker on its host. On a developer machine everything is one Compose stack.
- **When gVisor cannot be installed.** Only the runner needs a host that allows it; the API may stay on a managed
  container service, with the runner on one plain Linux VM. Where no VM is allowed, a cloud driver starts one
  managed task per box (for example a Fargate task), and the cloud isolates each task. Plain hardened containers
  share the host's kernel: acceptable only on a dedicated VM and where everyone who can reach the agents is
  trusted, not for public agents or shared hosting.
- **Later, with no new contract.** A Kubernetes driver in the same runner (a pod per box, gVisor or Kata as its
  runtime) when one host is not enough or a customer runs Kubernetes. A small VM per box only if a customer
  requires it. An open-source sandbox platform is judged again at that point.

## 8. The decision-support ticket (draft, not created)

**DSS-1 — Decision support workspace**

## Goal
Operators watch many data sources in one workspace, are told which one needs attention, and act through the chat.

## Scope
- An agent template, "Decision support", with the skills below and a controller run.
- **Source onboarding skill:** when a source is connected (SharePoint, Google Drive, a mailbox, an MCP server, an API), the agent explores it and writes one skill for it: what it is, how to query it, which fields matter, units, freshness.
- **Board skill:** how to propose and build a board for a source, and when to ask before adding one.
- **Controller run:** on a schedule and on "source changed", reads the sources through their skills, ranks what changed, flags the most important board with a reason, opens a new feed when one appears, notifies.
- **Actions:** operators ask in the chat; the agent acts with MCP or HTTP tools after approval.
- **v2:** a workspace preset for this template: boards on the left, chat on the right, an attention strip on top.

## Notes
- No new backend primitive: this ticket assembles connections, connector tools, agent-written skills, boards, the shared workspace, workspace tools, runs, triggers, notifications and approval.
- Anything missing while building it is a gap in a primitive and is fixed there.
- Emergency-management content (source lists, report formats) is out of scope; it is a skill pack on top.

## Relationships
- Builds on: CONN-1, CONN-3, MCP-1, HTTP-1, SKILL-1, SKILL-2, BOARD-1, BOARD-2, BOARD-3, RUN-1, RUN-2, RUN-3, APPR-1.

## 9. How to run this

1. Review the workstreams (section 5) and the architecture map. D1–D7 are settled. One question is open and is answered in the CODE-2 plan: how the runner isolates a box (proposal: gVisor).
2. Per workstream, a plan file in `.ai/` with its contract (tables, endpoints, events, files owned), reviewed before code. Tickets are created only when asked, with `needs-review`.
3. CORE was implemented by one agent and reviewed line by line. It is done.
4. Phase 1 workstreams run as parallel agents, one branch each, verified on the branch's ephemeral stack (`gendox-compose-scripts/ephemeral`) with the unit tests and the API tests of `gendox-e2e-tests`, merged in dependency order.

## Sources for section 2

- https://techcrunch.com/2026/09/29/meta-is-expanding-its-ai-agent-muse-to-small-businesses/
- https://www.unite.ai/meta-adds-small-business-skills-and-app-connectors-to-muse-ai-agent
- https://x.ai/news/grok-bot-for-enterprise
- https://docs.x.ai/grok/connectors/microsoft-teams
- https://fourweekmba.com/ai-xai-team-bots-shared-skills-private-memory/
- https://www.glean.com/perspectives/comparing-leading-ai-agent-platforms-features-and-pricing
