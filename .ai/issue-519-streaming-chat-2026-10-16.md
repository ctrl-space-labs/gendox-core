# Streaming chat with RAG stored as tool messages — #519 / #518

## Implementation

Normal HTTP chat makes the existing `advanced_search` tool available automatically, in stable tool order. It no longer performs hidden retrieval before completion. Agents' instructions remain user-managed: instruct the agent to search project knowledge before answering relevant questions. The tool description reinforces this behavior.

Search results are ordinary persisted tool messages, including selected section text and provenance. Unused search-result metadata is retained without its section text, preserving the completion text limit and Sources UI. Replaying history never repeats retrieval.

The chat history builder batch-loads original messages and local context, renders user messages consistently with the existing chat template and empty retrieval context, restores original image attachments, and canonicalizes structured tool/reasoning fields. Tool-result text is replayed verbatim. Suspended turns retain ordered message IDs rather than copies of message contents. Configuration changes while suspended fail explicitly. Legacy hidden retrieval is not reconstructed retrospectively.

Internal, batch, and subagent callers keep their existing completion-service signatures and supplied-context behavior. The existing loop receives an optional chat context; provider streaming returns the same assembled response used for persistence and accounting.

## API

`POST /gendox/api/v1/messages/completions?projectId={projectId}` accepts these additive fields:

- `stream`: false by default; true returns SSE.
- `role`: user by default; tool replies use `tool`.
- `toolCallId`: required for tool replies; the backend derives the tool name and owning turn.
- `clientToolResults`: false by default; enables synchronous CLIENT tools.

A tool reply uses the same endpoint and a body such as:

```json
{"threadId":"...","role":"tool","toolCallId":"...","value":"{\"status\":\"shipped\"}","stream":true}
```

Partial submissions return HTTP 202 with waiting status. The last required result resumes through the requested transport. Identical retries are idempotent; conflicting results are rejected. Anonymous widgets retain the issued resume token and send it as `X-Gendox-Completion-Token` for replies/status.

SSE events are `start`, `delta`, `message`, `tool_calls`, `waiting_for_tools`, `done`, and `error`. Delta payloads identify the turn/message index, field (`value` or `reasoningContent`), and text. Readable reasoning is streamed; opaque signatures remain persisted for provider replay.

`GET threads/{threadId}/completion-status` supports recovery. No dedicated tool-response endpoint exists.

## Client tools and recovery

`ai_tools.execution` defaults to ACTION; CLIENT waits for a result when the requesting client opts in. Registered backend handlers retain precedence. The existing settings dialog exposes async/sync execution. Host handlers may return Promises.

A small `completion_turn` table stores operational status, actor/session binding, ordered message IDs, pending calls, iteration count, configuration fingerprint, deadline, and worker ownership. Message and turn-order writes are atomic. No full request snapshots or `message.llm_context` column are added.

Unanswered CLIENT calls time out after 60 seconds and return saved error messages to the model. Interrupted generations preserve valid tool history without automatically repeating uncertain actions. Worker ownership and locked transitions prevent duplicate continuation.

Normal/embedded chat streams by default. Client actions are dispatched after persistence. Widget queues and unacknowledged results survive page navigation and deduplicate by turn/call. Browser disconnects do not cancel generation. Reloading restores saved messages and polls status every two seconds, showing Generating or Waiting for your page. Live-token reconnection and approval cards are deferred. Deep-thinking jobs retain their existing accepted-job/polling path.

## Validation and rollout

Verified 62 backend tests, including provider SSE framing/HTTP assembly, replay fidelity, real PostgreSQL history round trips, lifecycle/idempotency/timeouts, Sources limits, endpoint compatibility, and existing internal insight/batch callers. Migration defaults and the one-active-turn constraint were exercised against disposable PostgreSQL 18.

The frontend production build and non-fixing syntax/hooks checks passed. Three Playwright browser regressions passed using a deterministic local streaming API: progressive answer/reasoning, Promise-based host tool replies, and navigation recovery. External model APIs were not called.

For focused tests, use Maven's test selectors for `ProviderStream*Test`, `Chat*Test`, `AdvancedSearchToolTest`, and `EmbeddingsControllerStreamingTest`; the optional PostgreSQL test reads `GENDOX_TEST_JDBC_URL`. Browser tests run with `playwright test --config chat-streaming.config.cjs` after building the frontend. `PLAYWRIGHT_CHANNEL=chrome` can select installed Chrome when the cached browser is incompatible.

Apply the additive migration/backend before deploying the frontend and widget. Update existing agents' system prompts separately; this implementation does not rewrite them. Cache reuse assumes unchanged configuration and available original attachments; actual cache hits remain provider-controlled.
