# Use your own AI subscription in Gendox

2026-11-17. Planned, nothing implemented. To be built **after** the
[agentic platform roadmap](agentic-platform-roadmap-2026-11-10.md); it reuses several of its tasks (section 7).

Goal: a user runs Gendox on the AI subscription they already pay for (a ChatGPT plan first, a Claude plan later)
instead of an API key with API pricing.

Why, in the order the product owner gave it:

- **Adoption.** A new user starts with no API key and no second AI bill. Setup is one sign-in.
- **Power users.** A flat plan gives a heavy user far more usage than API pricing.
- **Cost.** The SaaS pays no model cost for messages that run on the user's plan.
- **Self-hosters.** The open-source installation works with nothing but a ChatGPT plan for completions.

---

## 1. What the providers allow (checked 2026-11-17)

| Provider | Route | Works in Gendox's own agent loop | Self-hosted | SaaS |
|---|---|---|---|---|
| OpenAI | "Sign in with ChatGPT" with ChatGPT plan usage: an OAuth access token accepted by the public Responses API | **Yes** | Allowed today for open-source, locally hosted apps. Self-service, no client secret. | Needs OpenAI's approval ("selected commercial partners", interest form). |
| Anthropic | None for a third-party loop. Only the unmodified Claude Code, signed in by the end user. | No. The CLI runs its own loop. | Yes, the CLI on the user's machine. | Only on the user's computer (desktop runner), never with tokens on our server. |

- **OpenAI.** Plus and Pro plans are eligible. The user sees Gendox in ChatGPT → Settings → Usage, and can set a
  weekly limit for it or disconnect it. OpenAI's docs describe the open flow for "open-source and locally hosted
  apps" and send "paid or remotely hosted" apps to an interest form.
- **Anthropic.** Its terms forbid a third party from offering Claude.ai login, storing those tokens or routing
  requests through plan credentials. They allow an end user to sign in to the unmodified Claude Code with their own
  subscription, also when another product starts it. This is what T3 Code does: a control layer over the CLIs the
  user installed and signed in to. The policy changed several times in 2026; re-read it before LOCAL starts.

## 2. Live test of the OpenAI route (2026-11-17)

A script outside the repository ran the open-source flow against a real ChatGPT plan. Tokens were kept in memory and
the session was revoked at the end.

| Check | Result |
|---|---|
| Dynamic registration (`client_id=dynamic_agent_client`), PKCE, loopback callback | Works. An issued client ID (`oaiapp_…`) comes back in the callback. |
| Token exchange | 200. Access token for one hour, refresh token, ID token. The scope `chatgpt.tokens.use.direct` was granted. |
| ID token | Issuer, audience (the issued client ID) and nonce match. The signature was not verified in the test. |
| `GET /v1/models` | 200, eight models listed for the plan. |
| `POST /v1/responses`, `store: false`, `stream: true` | Works, with token usage in `response.completed`. |
| `instructions` | Works. |
| Function tool, top level | Works: a `function_call` item with arguments. |
| Function tool inside a `namespace` tool | Works; the call carries the namespace. |
| `reasoning.effort` | Accepted. |
| `temperature` | Rejected: 400 `{"detail":"Unsupported parameter: temperature"}`. |
| `{type: "message", role: "system"}` input item | Rejected: 400 `{"detail":"System messages are not allowed"}`. |
| `max_output_tokens` | Accepted in the test, but documented as unsupported. Omit it. |
| `/v1/chat/completions`, `/v1/embeddings`, `/v1/moderations` | 401 `rejected_by_access_enforcement`. Only the Responses route is open. |
| Refresh | 200. New access token, and the refresh token rotates. |
| Revoke | 200. |

Not tested yet (PLAN-0): encrypted reasoning items (`include`), structured output (`text.format`), image and file
input, a real usage-limit error, whether the callback path is free to choose, long streams, parallel requests.

## 3. Decisions

| | Question | Outcome |
|---|---|---|
| S1 | Which routes | The ChatGPT plan first (workstream PLAN). Local CLIs later (workstream LOCAL), which is the only way to use a Claude plan. |
| S2 | Where a plan may be used | **Only in an organization with exactly one member.** No mark on the organization: the member count decides. When a second member joins, the plan stops being used there. |
| S3 | Which work uses it | In such an organization, **every completion**: chat, sub-agents, thread naming, tasks, scheduled runs. No difference per feature. |
| S4 | Other people's messages (public agent, widget, channels) in a one-member organization | **Nothing special in the first version**: they are answered like any other completion there. To be decided after reading OpenAI's terms for approved apps (PLAN-1). Risk recorded in section 8. |
| S5 | Model | **The agent's model wins.** The plan is used only when the agent's completion model is one the plan offers. Otherwise the API key path runs, as today. No model override by the user. |
| S6 | Plan limit reached | The run **stops and offers a choice**: a link to ChatGPT usage settings, and "continue with the API key" when one exists. Never a silent switch. OpenAI's guidelines ask for the same. |
| S7 | Gendox's own billing (SaaS) | A message that ran on the user's plan is **not counted as AI usage** of the Gendox plan. Platform limits (documents, storage, agents) still apply. |
| S8 | SaaS | **Self-hosted first.** The interest form is submitted now. The SaaS gets the feature behind a setting that stays off until OpenAI approves. |
| S9 | Local CLIs | **A one-user self-hosted installation first** (the API starts the CLI on its own host). The desktop runner later. |
| S10 | Whose credential | The connection belongs to a **user**, not to the organization. A deliberate exception to roadmap decision D2, like the desktop runner (CODE-3): the plan is the person's own. |

## 4. How the ChatGPT plan fits the code

- **The loop does not change.** Gendox already calls OpenAI's Responses API (`OpenAiResponsesServiceAdapter`). The
  plan route is the same endpoint with another bearer token and a narrower request.
- **One place decides the credential.** Today the completion path resolves an API key (the organization's, or the
  Gendox default for free-tier models) through `OrganizationModelKeyService`, from `CompletionRuntimeContextResolver`
  and a few other callers. That resolution returns a credential with a kind, *API key* or *plan token*, instead of a
  bare string. The plan token is chosen when all of these hold: the organization has one member, that member has an
  active connection, and the agent's completion model is on the plan's model list.
- **Embeddings, moderation and reranking keep an API key.** The plan token is refused there (section 2), so
  document search still needs the organization's key or the Gendox default.
- **The request in plan mode.** Always streamed, also for callers that do not stream (the adapter collects the
  stream). `store: false` (already so). No `temperature`, `top_p`, `max_output_tokens`, `metadata` or `user`. The
  system prompt goes in `instructions` (already so), never as a system-role item.
- **Tokens.** Stored encrypted through SEC-1. The access token lasts an hour and the refresh token rotates on every
  use, so a refresh is serialized per connection across API instances; two refreshes at once would invalidate the
  session.
- **Sign-in on a local installation.** The open-source flow returns to `http://127.0.0.1:<port>/auth/callback` on
  the computer that runs the browser. The API listens there when it runs on that computer. When the installation
  is on another machine, the user completes sign-in in the browser and pastes the returned address into Gendox, or
  the desktop app (CLIENT-2) receives it. Chosen in PLAN-2.

## 5. Workstream PLAN — ChatGPT plan usage

- **PLAN-0 Spike, the rest.** Section 2 covers the basics. Remaining: the untested items listed there, run with
  the requests Gendox really sends (tools, reasoning with encrypted items, a JSON schema answer, an image).
- **PLAN-1 OpenAI partnership and terms.** Submit the interest form for a hosted app (the product owner does this).
  Read the terms for approved apps and settle S4, and whether scheduled runs count as use by the signed-in user.
- **PLAN-2 Connection.** A table for a user's plan connection: user, organization, provider, issued client ID,
  host ID of the installation, encrypted tokens, granted scopes, expiry, state. Sign-in with PKCE, state and nonce;
  the ID token verified against OpenAI's published keys; plan usage enabled only when `chatgpt.tokens.use.direct`
  was granted. Refresh, serialized. Sign-out revokes the session. A request or refresh that shows the user
  disconnected Gendox in ChatGPT marks the connection as disconnected. Reuses the OAuth pieces of CONN-1.
- **PLAN-3 The one-member rule (S2).** Checked when the credential is resolved, so it always reflects the current
  members. The invitation screen says that inviting someone stops plan usage in this organization; the owner is
  told when it has stopped.
- **PLAN-4 Credential resolution (S3, S5).** The change described in section 4, with every caller that resolves a
  completion key moved to it. Where no plan applies, the result is what it is today.
- **PLAN-5 Adapter, plan mode.** The request rules of section 4. The plan's model list read from `/v1/models` with
  the user's token and cached per connection; matched to `ai_models` by model name. Errors mapped to Gendox errors:
  the plain `{"detail": …}` bodies and the `subscription_sharing_*` codes, including a limit error that arrives as
  `response.failed` after the stream has started.
- **PLAN-6 Limit reached (S6).** The run ends with a message in the thread carrying the two actions. "Continue
  with the API key" re-runs the turn on the key path, for that turn only.
- **PLAN-7 Usage (S7).** Each completion records which path paid for it. The message check of the Gendox plan
  skips plan-path messages. The usage screen (GOV-2) shows both paths.
- **PLAN-8 v2 screens.** Following OpenAI's UI guidelines: a "Use your ChatGPT plan" card with **Continue with
  ChatGPT** in settings and onboarding; a one-time confirmation after the first sign-in; "Using ChatGPT plan" with
  a **Manage usage** link next to the composer; the limit message; which Gendox plans support it, on the pricing
  page.
- **PLAN-9 Setting and SaaS switch (S8).** A setting turns the feature on per installation and names the mode:
  the open-source flow, or the partner flow with a registered client. Off on the SaaS until approval. The partner
  flow is designed when OpenAI's partner documentation is available to us.
- **PLAN-10 Tests.** A mock of OpenAI's sign-in and plan-mode Responses endpoints in the ephemeral stack, next to
  the mock model, so the e2e suite covers connect, chat, limit reached, refresh and disconnect with no real account.
- **PLAN-11 Documentation.** A user page (connect, limits, what still needs an API key) and a self-hosting page.

## 6. Workstream LOCAL — the Claude Code and Codex CLIs (later)

Gendox does not run its loop here. The CLI is the agent; Gendox starts it, shows its stream and gives it tools.

- **LOCAL-1 Spike.** Drive Claude Code (Agent SDK or its streamed JSON output) and Codex (`codex app-server`,
  JSON-RPC over stdio) from Java: start, send a turn, read events, resume a session. Re-read both providers' terms.
- **LOCAL-2 Local agent provider (S9).** In a one-user self-hosted installation the API starts the CLI on its own
  host, where the user has signed in to it themselves. A model entry such as "Claude Code (local)" selects it. The
  Compose stack runs the API in a container, so this needs the API on the host or the CLI inside the container;
  decided in the spike.
- **LOCAL-3 Gendox tools over MCP.** Search, documents and skills reach the CLI through the Gendox MCP server
  (MCPS-1).
- **LOCAL-4 Threads and approvals.** A Gendox thread maps to a CLI session and resumes it. The CLI's permission
  prompts appear as approval cards (APPR-1, APPR-2).
- **LOCAL-5 Desktop runner.** The same provider through the desktop app's runner (CODE-3), for the SaaS and for
  shared installations. Only its owner's own threads, as CODE-3 already says.
- **LOCAL-6 v2.** Which CLIs are installed and signed in; choosing a local agent as an agent's model.

## 7. What it reuses from the roadmap

| Roadmap task | Used by |
|---|---|
| SEC-1 secrets at rest | PLAN-2: the tokens. |
| CONN-1 connections (OAuth with refresh) | PLAN-2: the same OAuth code, a different owner (S10). |
| GOV-2 usage | PLAN-7. |
| RUN-1 … RUN-3 scheduled and triggered runs | S3: they use the plan in a one-member organization. |
| APPR-1, APPR-2 approvals | LOCAL-4. |
| MCPS-1 Gendox as an MCP server | LOCAL-3. |
| CLIENT-2 desktop app, CODE-3 desktop runner | PLAN-2 (sign-in for a remote installation), LOCAL-5. |

Order: PLAN-1 can start now, because approval takes time and blocks nothing. Then PLAN-0, PLAN-2 … PLAN-5, which
give a working chat; then PLAN-6 … PLAN-11. LOCAL after PLAN is in use, LOCAL-5 after CODE-3.

## 8. Open questions and risks

- **S4, other people on a personal plan.** OpenAI grants plan usage for requests made for the signed-in user. A
  public agent, a widget or a channel in a one-member organization serves other people. The first version does not
  separate them; if the terms forbid it, the fix is to send those messages down the API key path, which PLAN-4
  makes a small change. OpenAI can cut an app off, so settle this before the feature is advertised.
- **Preview.** Plan usage is a preview with its own limits (section 2). The list of unsupported fields and tools
  can change; PLAN-10's mock must be kept in line with the real route.
- **A remote self-hosted installation with several users** is outside OpenAI's "locally hosted" wording. S2 limits
  usage to one-member organizations, but whether such an installation may offer it at all is a PLAN-1 question.
- **Model list.** Plan models may have no `ai_models` row yet. Adding rows is manual today; PLAN-5 decides whether
  to add them from the plan's list.

## Sources

- OpenAI, Sign in with ChatGPT documentation: https://developers.openai.com/siwc
- OpenAI, ChatGPT plan usage for open-source apps: https://developers.openai.com/siwc/token-sharing-open-source
- OpenAI, interest form for hosted apps: https://openai.com/form/sign-in-with-chatgpt-interest/
- Anthropic, Claude Code legal and compliance: https://code.claude.com/docs/en/legal-and-compliance
- T3 Code: https://github.com/pingdotgg/t3code
