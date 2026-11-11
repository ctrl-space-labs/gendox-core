# CORE — the completion contract

Plan for the CORE workstream of the [agentic platform roadmap](agentic-platform-roadmap-2026-11-10.md).

**Status:** CORE-1 is written and passes on the unchanged code. CORE-3, CORE-2 and CORE-4 are not started.

**Goal:** make `CompletionService` smaller and pin its behaviour with tests, so the workstreams that follow add tools,
channels and triggers without editing the loop. Three of the four tasks change no behaviour.

**Not a goal:** new features, new interfaces for future needs, or cleanups that are not required by the four tasks.

## What the file holds today

`CompletionService.java`, 966 lines:

| Part | Lines (about) | After CORE |
|---|---|---|
| The loop: `getCompletion` and its overloads | 150 | Stays |
| Chat entry points: `getCompletionSearch`, `resumeCompletionSearch`, search mode, sources, chat response | 160 | Stays |
| Moderation, audit logs, small helpers | 70 | Stays |
| Runtime context: the `resolve*` family, skill tools, skills header, the question template | 380 | Moves (CORE-3) |
| Tool execution: `handleToolExecution` | 80 | Moves (CORE-2) |
| Fields, constructor, imports | 125 | Shrinks |

Expected size afterwards: about 450 lines, with the loop readable on one screen and a half.

Existing tests around it:

- `CompletionServiceChatTest`: search modes, sources, a client tool that suspends the turn, a client that cannot answer, a resumed turn.
- `CompletionServiceToolLimitTest`: the configured number of rounds.
- `CompletionServiceSkillsTest`: skill tools, the skills header, who gets skills.
- `CompletionTurnServiceTest`, `AiToolRegistryTest`, `EmbeddingsControllerStreamingTest`.

Callers of `getCompletion` that must keep working unchanged: chat (`EmbeddingsController`), deep thinking, document
insights (processor and summary), insight questions, digitization (with and without a project), and the three
sub-agent tools.

## Order

CORE-1 → CORE-3 → CORE-2 → CORE-4. CORE-3 comes before CORE-2 because the tool execution class takes the runtime
context record that CORE-3 makes a class of its own. One commit per task, so each can be reviewed alone.

## CORE-1 — tests that pin down the loop

New class `CompletionServiceLoopTest`, same style as `CompletionServiceChatTest` (mock adapter with a queue of
responses, recording what each model call was sent). The setup the two classes share moves into one test fixture
rather than being copied.

Cases not covered today:

| Case | What it pins |
|---|---|
| A plain answer | One model call; one assistant message saved with model, project, thread and the agent's user; a request and a response audit log with the token counts. |
| A tool that runs in Gendox | The registry is called with the arguments and the context; the tool message is saved with its call id and name; the second model call receives the assistant message, then the tool result. |
| Two tool calls in one message | Two results, in the order of the calls. |
| A tool that fails | The error is the tool's result and the turn continues. |
| A caller without a project | Every value comes from the overrides; a missing one is `COMPLETION_RUNTIME_OVERRIDE_REQUIRED`. |
| Overrides and the agent | System prompt, model, tools and excluded tool names from the overrides win over the agent's. |
| Given history | `previousMessages` in the overrides replaces the stored history. |
| Moderation | A flagged question is refused before any model call. |
| Cancellation | A cancelled token stops the loop with `DEEP_THINKING_CANCELLED`; a token gives 20 rounds. |
| The last round | The warning message is added before the last allowed model call. |
| A tool that is not offered | Today's behaviour, written down so CORE-4 changes it on purpose. |
| The listener | It is told about every saved message; its `deltas` reach the adapter; a response schema reaches the adapter. |

Done when: the new and existing tests pass on the unchanged code.

As written: `CompletionServiceFixture` holds the shared setup, `CompletionServiceChatTest` extends it with its tests
unchanged, and `CompletionServiceLoopTest` adds 25 tests. Two cases were added to the table while writing: a client
tool in the last allowed round is not waited for, and a caller with a cancellation token passes it to its tools.

## CORE-3 — the runtime context gets its own class

A move, with no change of behaviour.

`CompletionRuntimeContextResolver` (package `services`) receives:

- `resolveCompletionRuntimeContext` and every `resolve*` method it calls;
- `skillsFor`, `withSkillTools`, `appendSkillsHeader`, `appendInstructions`;
- `convertToAiModelTextQuestion` (no caller outside the file);
- `missingOverrideException`, `hasSystemPromptOverride`.

`CompletionRuntimeContext` becomes a record of its own in the same package.

`CompletionService` keeps one line:

```java
CompletionRuntimeContext runtimeContext = contextResolver.resolve(message, nearestSections, project, overrides);
```

Details:

- **`toolName`** (the function name inside a tool's JSON) is needed by the loop file (`chatTools`), the resolver and the tool execution. It becomes one static helper next to `AiTools`; today it exists twice in slightly different forms.
- **Dependencies that move with the code** leave `CompletionService`'s constructor: the template repository, `DocumentUtils`, `AiModelService`, `SkillService`, `EmbeddingService`. Nothing else is removed from the constructor in this task.
- **Tests:** `CompletionServiceSkillsTest` tests methods that move, so it becomes `CompletionRuntimeContextResolverTest` with the same cases. The other test classes change only how the service is constructed.

Done when: all tests pass, and the diff of `CompletionService` is deletions plus the one call.

## CORE-2 — tool execution in one class

`ToolExecutionService` (package `services`, beside `CompletionTurnService`) receives `handleToolExecution`. It is the
single place where a tool call is looked at before it runs: is it offered, where does it run, does the turn wait.

Shape:

```java
public record ToolRound(List<AiModelMessage> results, List<PendingCall> pending) {}

public ToolRound run(Message assistantMessage, List<AiModelMessage> history,
                     CompletionRuntimeContext context, CompletionListener listener, boolean canWait)
```

Inside, per call, one decision and three outcomes that exist today:

| Where the tool runs | When | Outcome |
|---|---|---|
| In Gendox | A handler is registered for it | The handler's result |
| On the client, and the turn waits | No handler, `execution = CLIENT`, the client can answer, not the last round | A pending call, no tool message |
| On the client, as an action | No handler otherwise | `{"status":"executed"}`, and the listener is told |

The loop becomes:

```java
ToolRound round = toolExecutionService.run(completionResponseMessage, previousMessages, runtimeContext, listener, canWaitForClient);
// save round.results()
if (!round.pending().isEmpty()) { suspend and return }
```

Details:

- **Result instead of an out-parameter.** Today the pending calls come back through a list passed in; the record makes the two outcomes of rule 5 of the roadmap visible in the signature.
- **The "executed" answer moves here** from `AiToolRegistry.execute`, where it is the fallback for a missing handler (marked with a TODO). The registry then only runs handlers, and "where a tool runs" is decided in one method. Behaviour is the same.
- **The unused overload** of `handleToolExecution` (six parameters, no caller) is not carried over.
- **Bean cycle:** sub-agent tools already reach `CompletionService` lazily; the new class sits on the same path and adds no new cycle.
- **Tests:** `ToolExecutionServiceTest` for the three outcomes and the listener call; the loop tests keep passing with a real `ToolExecutionService` over the mocked registry.

What this class is for later, without building it now:

| Workstream | What it adds here |
|---|---|
| APPR-1 | A fourth outcome: the turn waits for a yes. `PendingCall` gains why it waits. |
| MCP-1, HTTP-1 | More places a tool can run. |
| GOV-4 | "Not allowed for this agent" as an error result. |

Done when: all tests pass, and the diff of `CompletionService` is deletions plus the call.

## CORE-4 — a tool that is not offered

The one behaviour change.

- **Today:** when the model calls a tool name that is not among the offered tools, the turn ends with `AI_TOOL_NOT_FOUND` and the user gets an error.
- **After:** the call gets a tool result with that error code and the names of the offered tools, in the same error shape `ToolsHandlerAdvice` gives a failed tool. The model reads it and corrects itself or answers. The round counts toward the limit.
- **Where:** `ToolExecutionService`, a few lines. The CORE-1 test for this case is updated in the same commit.

## Verification

- `mvn test` for the backend.
- In `local-development-test` with the mock model, after `mvn package` and a rebuild of the whole stack: a chat answer, a chat turn with a search, a client tool that waits and resumes through the API, a deep thinking run, one Document Insights run and one Digitization run.

## Files

| File | Change |
|---|---|
| `services/CompletionService.java` | Shrinks; two new calls |
| `services/CompletionRuntimeContextResolver.java`, `services/CompletionRuntimeContext.java` | New (moved code) |
| `services/ToolExecutionService.java` | New (moved code, plus CORE-4) |
| `ai/engine/tools/engine/AiToolRegistry.java` | The missing-handler fallback leaves |
| `model/AiTools.java` or a helper beside it | `toolName` |
| Tests | `CompletionServiceLoopTest`, `ToolExecutionServiceTest` new; `CompletionServiceSkillsTest` renamed; constructors in the others |

No migration, no API change, no frontend change.

## Decided in review

1. **Where a tool's own access rule is checked.** The task tools call `requireProjectMember` inside `execute`. With approval, the order matters: access first, then the question to the user, then the run. An optional `checkAccess` on `AiToolHandler`, called by `ToolExecutionService` before anything else, fixes the order in one place. It belongs to the APPR-1 plan, not to CORE.
   - **The rule itself is not written again.** `checkAccess` names an operation (the same `OP_*` names `@PreAuthorize` uses) and the project or organization it applies to, and `ToolExecutionService` asks `SecurityUtils.can` for the answer. `requireProjectMember` already works this way; the hook moves that call to one place and adds no second kind of check.
2. **`toolName` location:** a static method, so the `AiTools` entity gains no property and the API's JSON stays as it is. The class it sits on is chosen in CORE-3, the first task that needs it in two files.

## Noticed while reading, not part of CORE

- The streaming plan says the `ALWAYS` search mode keeps the search before answering and is not a forced tool choice; the code sets a required tool choice on the first model call. One of the two should be brought in line, in that plan.
- "A cancellation token means deep thinking" and "the last 25 messages" are both marked with TODOs in the loop. The roadmap leaves them to RUNS and to the history budget.
- Some constructor parameters of `CompletionService` are not used by any code in the file. Left alone here.
- `mvn test` has six errors before CORE, in `DownloadServiceTest`, `DocxCommentAnnotatorTest` and `AssistantToolSupportTest` (the last one passes when run alone). CORE is checked against the other tests.
