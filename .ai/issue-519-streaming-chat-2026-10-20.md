# Streaming chat, client tools and knowledge search mode — #519 / #518 / #542

Revision of the [2026-10-16 plan](issue-519-streaming-chat-2026-10-16.md), which is kept as first written. This file is self-contained.

What changed since 2026-10-16:

- **One completion path.** JSON and SSE run the same `CompletionService.getCompletionSearch`; the `stream` flag only picks the transport. The separate chat orchestration (`ChatCompletionService`, `ChatCompletionRun`, `ChatHistoryService`) is gone.
- **No state while a turn generates.** A `completion_turn` row exists only for a turn that waits for client tool results. No history snapshot, worker ownership, heartbeat or configuration fingerprint is stored.
- **Retrieval is unchanged by default.** A per-agent `advanced_search_mode` (`ALWAYS` | `AUTO` | `OFF`, #542) decides it; `ALWAYS`, the default, keeps the search before answering.
- **No copies of retrieved text.** The sections a question was asked with are linked to it (`message_section`) and rendered again from those links; nothing new is stored on the message.
- **One API for every message.** A client tool result is a message with `role: "tool"` on `POST messages/completions`, not a separate endpoint (the redesign's `POST threads/{t}/messages/{m}/tool-results` is not added).
- **No timeout in the backend.** A waiting call waits until its result arrives or a new user message cancels it. Whether a tool gives up, and after how long, is the client's choice per tool (for example `open_web_page` may, a code-execution tool should not); a client that gives up posts an error result as the tool's value. How the frontend lets a tool developer set this is open.
- Cohere and Mistral keep their current (tool-less) requests; they only gain streaming.

## Scope

- **#519** — token-by-token SSE on `POST messages/completions` when `stream: true`. Without it the JSON response keeps its shape.
- **#518** — sync client tools (*Runs on Client side · sync*): a `CLIENT` call stops the turn until the page or app returns the result.
- **Background continuation** — a streamed generation runs on the task executor and keeps going when the browser leaves.
- **#542 (part)** — the search mode and a cache-stable history. The open questions on `AUTO` answer quality, `advanced_search_model_id` and rerank placement stay with #542.
- Internal, batch, deep-thinking and sub-agent callers of `CompletionService` keep their signatures and behaviour.

## How a chat completion runs

`EmbeddingsController` saves the question as before, then:

```java
return respond(stream, clientToolResults, savedMessage,
        listener -> completionService.getCompletionSearch(savedMessage, project, listener));
```

`respond` either runs the completion in the request and returns its JSON, or starts it on the task executor with an `SseCompletionListener` and returns the event stream. A `CompletionListener` is the client a completion answers: the base class (JSON, and `CompletionListener.none()` for internal callers) receives nothing while it runs; the SSE listener sends events. Internal callers get `none()` through the existing `getCompletion` overloads.

Inside the existing tool loop the listener is told about each saved message, receives the provider's tokens (`deltas()`, null = no streaming), and is told about client tool calls. Adapters gained one overload, `askCompletion(…, Consumer<CompletionDelta> deltas)`: with `deltas` null it is the ordinary request; otherwise `ProviderStreamClient` sends the same request with streaming on and `StreamAccumulator` rebuilds the provider's normal response, so the converters, persistence and audit logs are unchanged.

What chat sends differently is passed through the existing `CompletionRuntimeOverridesDTO`:

- `previousMessages`: the history, with every earlier question rendered with the chat template and the sections it was asked with (its `message_section` participants), local contexts in a fixed order. A later turn therefore resends the same bytes and the provider's prompt cache keeps matching.
- `aiTools`: the agent's tools sorted by name (a stable prefix), plus `advanced_search` unless the mode is `OFF`. Other features that add tools (e.g. skills) still add them on top.

## Knowledge search mode (#542)

`project_agent.advanced_search_mode`, default `ALWAYS`:

| Mode | Before answering | `advanced_search` tool |
|------|------------------|------------------------|
| `ALWAYS` | The existing search (`EmbeddingService.findClosestSections`, with query rewriting and rerank as today) | Offered, for a follow-up search |
| `AUTO` | Nothing | Offered; the agent decides |
| `OFF` | Nothing | Not offered |

`advanced_search_enable` keeps its meaning (rewrite the query with a model before searching).

`ALWAYS` is not a forced `tool_choice`: Anthropic rejects a forced tool choice with extended thinking on, and an injected tool call breaks replay on providers that require a thinking block or signature on it.

Sources: the found sections are linked to the question (participants and search history, as before); each answer gets copies of those links plus the sections returned by `advanced_search` calls in the turn. A user's own message shows no Sources chip.

## Client tools and waiting turns (#518)

`ai_tools.execution`: `ACTION` (default, *async*: the agent is told it was executed) or `CLIENT` (*sync*). A tool with a backend handler always runs in Gendox. A client opts in with `clientToolResults: true`; otherwise `CLIENT` tools behave as `ACTION`.

When the model calls a `CLIENT` tool and the client can answer, the call gets no tool message; `CompletionTurnService.suspend` saves a `completion_turn` row (id = the question's id) with the pending calls and the model calls made so far, and the loop returns. A turn that waits again after resuming reuses its row. A turn on its last allowed model call does not wait; the call is treated as `ACTION`.

A tool result is posted to the same `POST messages/completions?projectId=` as any message: `{"threadId", "role": "tool", "toolCallId", "value", "stream"}`. It creates no user message and does not count as a sent message. The backend finds the call among the thread's waiting turn by its id. While other calls wait it returns 202 with the status; the last result marks the turn `RESUMED` (under a row lock, so only one request resumes it) and `CompletionService.resumeCompletionSearch` continues through the same loop, answering as JSON or SSE like any message: the overrides add `turnMessages` (the assistant and tool messages already saved after the question) and `turnIterations`. Repeating a saved result is a no-op; a different one is rejected. Several waiting calls take one request each.

- The backend sets no deadline. A tool that should not wait forever is timed out by the client, which posts an error result for it.
- A new user message answers a waiting turn's calls with `CLIENT_TOOL_CANCELLED`, so the history stays valid.
- Who may answer: the signed-in user who sent the question, or an anonymous session holding the resume token. The token is issued once, when the turn first waits (`waiting_for_tools` event and the JSON `resumeToken`); only its SHA-256 is stored. It is sent as `X-Gendox-Completion-Token`.

The host page registers handlers with the existing `window.gendox.tools.registerTool(name, fn)`; a handler may return a Promise. The redesign shows `GendoxChat.onTool(name, fn)`; aligning the names is open. `requires_approval` is deferred.

## Status and recovery

`GET threads/{threadId}/completion-status` returns `IDLE`, `GENERATING` or `WAITING_FOR_TOOLS` (with its calls, only to the session that may answer). With no state kept while a turn generates, `GENERATING` means the thread's latest message is not a final answer and is less than 5 minutes old. A reloaded page shows saved messages and polls this.

## SSE events

`start` {threadId, turnId}, `delta` {turnId, messageIndex, field `value` | `reasoningContent`, text}, `message` {threadId, turnId, messageIndex, message}, `tool_calls` (ACTION calls for the page), then one of `done` (the JSON response body), `waiting_for_tools` (the status, with the resume token), `error`. `turnId` is the question's id. A keep-alive comment every 15 s holds idle proxies open.

## Rollout

Apply the migrations and backend before the frontend and widget. Existing agents default to `ALWAYS`; switching one to `AUTO` should follow the evaluation #542 asks for.

## Validation

Unit tests cover the provider stream framing and assembly, the controller (JSON and SSE through the same completion, tool results, deep thinking unchanged), the chat path (search modes, history rendering, suspending and resuming a turn) and the turn service (partial, repeated and conflicting results, sessions, cancel, status). Browser regressions run against a deterministic local streaming API (`playwright test --config chat-streaming.config.cjs`, after building the frontend). Not yet run end to end against a real stack and provider.
