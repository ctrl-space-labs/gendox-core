package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.ModerationResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.ToolExecutionContext;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.GendoxException;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiTools;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AuditLogs;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionRuntimeOverridesDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.CancellationToken;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * The loop of CompletionService#getCompletion: what the model is sent, what is saved, how tool calls
 * run and when the loop stops. It pins the behaviour every caller relies on.
 */
class CompletionServiceLoopTest extends CompletionServiceFixture {

    private final AiModel otherModel = new AiModel();

    {
        otherModel.setId(UUID.randomUUID());
        otherModel.setApiType(apiType());
    }

    private List<String> roles(List<Message> messages) {
        return messages.stream().map(Message::getRole).toList();
    }

    /** Everything a caller without a project has to give. */
    private CompletionRuntimeOverridesDTO.CompletionRuntimeOverridesDTOBuilder withoutProject() throws Exception {
        when(aiModelService.getByName("other-model")).thenReturn(otherModel);
        return CompletionRuntimeOverridesDTO.builder()
                .systemPrompt("You are someone else.")
                .completionModelName("other-model")
                .completionApiKey("given-key")
                .maxTokens(50L)
                .temperature(0.1)
                .topP(0.9)
                .projectId(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .createdByAgentUserId(UUID.randomUUID());
    }

    // ------------------------------------------------------------------ a plain answer

    @Test
    void aPlainAnswerIsOneModelCallAndOneSavedMessage() throws Exception {
        when(embeddingService.getApiKey(project.getOrganizationId(), model)).thenReturn("organization-key");
        responses.add(CompletionResponse.builder()
                .usage(Usage.builder().promptTokens(7).completionTokens(3).totalTokens(10).build())
                .choices(List.of(Choice.builder().index(0).finishReason("stop")
                        .message(AiModelMessage.builder().role("assistant").content("Answer").build()).build()))
                .build());

        List<Message> messages = service.getCompletion(question, List.of(), project, null);

        assertEquals(1, sentMessages.size());
        assertEquals("Be helpful", sentSystemPrompts.get(0));
        assertSame(model, sentModels.get(0));
        assertEquals("organization-key", sentApiKeys.get(0));
        assertEquals(1000L, sentParams.get(0).getMaxTokens());
        assertEquals(0.5, sentParams.get(0).getTemperature());
        assertEquals(1.0, sentParams.get(0).getTopP());
        assertEquals("auto", sentToolChoices.get(0));
        // the question goes through the agent's chat template
        assertEquals("Q:What is new? C:", sentMessages.get(0).getLast().getContent());
        assertEquals(question.getId(), sentMessages.get(0).getLast().getId());

        assertEquals(1, messages.size());
        Message answer = messages.get(0);
        assertEquals("assistant", answer.getRole());
        assertEquals("Answer", answer.getValue());
        assertEquals(model.getId(), answer.getAiModelId());
        assertEquals(project.getId(), answer.getProjectId());
        assertEquals(question.getThreadId(), answer.getThreadId());
        assertEquals(agent.getUserId(), answer.getCreatedBy());
        verify(messageService).createMessage(answer);

        // a request and a response audit log, with the tokens of each side
        ArgumentCaptor<AuditLogs> logs = ArgumentCaptor.forClass(AuditLogs.class);
        verify(auditLogsService, times(2)).saveAuditLogs(logs.capture());
        assertEquals(List.of(7L, 3L), logs.getAllValues().stream().map(AuditLogs::getTokenCount).toList());
        for (AuditLogs log : logs.getAllValues()) {
            assertEquals(project.getId(), log.getProjectId());
            assertEquals(project.getOrganizationId(), log.getOrganizationId());
        }
    }

    // ------------------------------------------------------------------ history

    @Test
    void theStoredHistoryComesBeforeTheQuestion() throws Exception {
        when(messageService.getPreviousMessages(question, 25)).thenReturn(new ArrayList<>(List.of(
                AiModelMessage.builder().role("user").content("Earlier").build(),
                AiModelMessage.builder().role("assistant").content("Reply").build())));
        respondWithAnswer();

        service.getCompletion(question, List.of(), project, null);

        assertEquals(List.of("Earlier", "Reply", "Q:What is new? C:"),
                sentMessages.get(0).stream().map(AiModelMessage::getContent).toList());
    }

    @Test
    void aGivenHistoryReplacesTheStoredOne() throws Exception {
        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .previousMessages(new ArrayList<>(List.of(AiModelMessage.builder().role("user").content("Given").build())))
                .build();
        respondWithAnswer();

        service.getCompletion(question, List.of(), project, null, overrides);

        assertEquals(List.of("Given", "Q:What is new? C:"),
                sentMessages.get(0).stream().map(AiModelMessage::getContent).toList());
        verify(messageService, never()).getPreviousMessages(any(), anyInt());
    }

    // ------------------------------------------------------------------ tools

    @Test
    void aToolThatRunsInGendoxGetsItsArgumentsAndItsResultGoesBackToTheModel() throws Exception {
        AiTools lookup = tool("lookup", null);
        agent.getAiTools().add(lookup);
        when(aiToolRegistry.supports("lookup")).thenReturn(true);
        when(aiToolRegistry.execute(eq("lookup"), any(), any())).thenReturn(mapper.readTree("{\"found\":3}"));
        respondWithToolCalls(toolCall("call-1", "lookup", "{\"city\":\"Athens\"}"));
        respondWithAnswer();

        List<Message> messages = service.getCompletion(question, List.of(), project, null);

        assertEquals(List.of("assistant", "tool", "assistant"), roles(messages));
        Message call = messages.get(0);
        Message result = messages.get(1);

        ArgumentCaptor<JsonNode> arguments = ArgumentCaptor.forClass(JsonNode.class);
        ArgumentCaptor<ToolExecutionContext> context = ArgumentCaptor.forClass(ToolExecutionContext.class);
        verify(aiToolRegistry).execute(eq("lookup"), arguments.capture(), context.capture());
        assertEquals("{\"city\":\"Athens\"}", arguments.getValue().asText());
        assertSame(project, context.getValue().project());
        assertSame(agent, context.getValue().agent());
        assertSame(call, context.getValue().parentMessage());
        assertSame(lookup, context.getValue().toolDefinition());
        assertNull(context.getValue().cancellationToken());
        assertEquals("Q:What is new? C:", context.getValue().parentPreviousMessages().getFirst().getContent());

        assertEquals("call-1", result.getToolCallId());
        assertEquals("lookup", result.getName());
        assertEquals("{\"found\":3}", result.getValue());
        assertEquals(project.getId(), result.getProjectId());
        assertEquals(question.getThreadId(), result.getThreadId());
        assertEquals(agent.getUserId(), result.getCreatedBy());

        // the next model call gets the assistant's call, then the result
        List<AiModelMessage> second = sentMessages.get(1);
        assertEquals(3, second.size());
        assertEquals("assistant", second.get(1).getRole());
        assertEquals("call-1", second.get(1).getToolCalls().get(0).get("id").asText());
        assertEquals("tool", second.get(2).getRole());
        assertEquals("call-1", second.get(2).getToolCallId());
        assertEquals("{\"found\":3}", second.get(2).getContent());
        assertEquals(List.of("auto", "auto"), sentToolChoices);
    }

    @Test
    void twoToolCallsInOneMessageGiveTwoResultsInTheOrderOfTheCalls() throws Exception {
        agent.getAiTools().add(tool("lookup", null));
        agent.getAiTools().add(tool("count", null));
        when(aiToolRegistry.supports(anyString())).thenReturn(true);
        when(aiToolRegistry.execute(eq("lookup"), any(), any())).thenReturn(mapper.readTree("{\"found\":3}"));
        when(aiToolRegistry.execute(eq("count"), any(), any())).thenReturn(mapper.readTree("{\"count\":9}"));
        respondWithToolCalls(toolCall("call-1", "count", "{}"), toolCall("call-2", "lookup", "{}"));
        respondWithAnswer();

        List<Message> messages = service.getCompletion(question, List.of(), project, null);

        assertEquals(List.of("assistant", "tool", "tool", "assistant"), roles(messages));
        assertEquals(List.of("call-1", "call-2"), messages.subList(1, 3).stream().map(Message::getToolCallId).toList());
        assertEquals(List.of("{\"count\":9}", "{\"found\":3}"), messages.subList(1, 3).stream().map(Message::getValue).toList());
        assertEquals(4, sentMessages.get(1).size());
    }

    @Test
    void aToolErrorIsTheToolsResultAndTheTurnContinues() throws Exception {
        agent.getAiTools().add(tool("lookup", null));
        when(aiToolRegistry.supports("lookup")).thenReturn(true);
        // what the registry returns for a handler that throws
        when(aiToolRegistry.execute(eq("lookup"), any(), any())).thenReturn(mapper.readTree("{\"error\":{\"code\":\"MISSING_ARGUMENT\"}}"));
        respondWithToolCall("lookup");
        respondWithAnswer();

        List<Message> messages = service.getCompletion(question, List.of(), project, null);

        assertEquals(List.of("assistant", "tool", "assistant"), roles(messages));
        assertEquals("{\"error\":{\"code\":\"MISSING_ARGUMENT\"}}", sentMessages.get(1).getLast().getContent());
    }

    @Test
    void aToolThatIsNotOfferedGetsAnErrorResultAndTheTurnContinues() throws Exception {
        agent.getAiTools().add(tool("lookup", null));
        respondWithToolCall("invented");
        respondWithAnswer();

        List<Message> messages = service.getCompletion(question, List.of(), project, null);

        assertEquals(List.of("assistant", "tool", "assistant"), roles(messages));
        assertEquals("call", messages.get(1).getToolCallId());
        JsonNode error = mapper.readTree(messages.get(1).getValue());
        assertEquals("AI_TOOL_NOT_FOUND", error.get("errorCode").asText());
        assertEquals("Tool invented is not available. Available tools: lookup", error.get("errorMessage").asText());
        // the model reads the error in its next call
        assertEquals(messages.get(1).getValue(), sentMessages.get(1).getLast().getContent());
        verify(aiToolRegistry, never()).execute(any(), any(), any());
    }

    // ------------------------------------------------------------------ the caller's own values

    @Test
    void aCallerWithoutAProjectGivesEveryValue() throws Exception {
        CompletionRuntimeOverridesDTO overrides = withoutProject().build();
        respondWithAnswer();

        List<Message> messages = service.getCompletion(question, List.of(), null, overrides);

        assertEquals("You are someone else.", sentSystemPrompts.get(0));
        assertSame(otherModel, sentModels.get(0));
        assertEquals("given-key", sentApiKeys.get(0));
        assertEquals(50L, sentParams.get(0).getMaxTokens());
        assertEquals(0.1, sentParams.get(0).getTemperature());
        assertEquals(0.9, sentParams.get(0).getTopP());
        assertTrue(sentTools.get(0).isEmpty());
        // no agent, so no chat template: the question is sent as it is
        assertEquals("What is new?", sentMessages.get(0).getLast().getContent());

        Message answer = messages.get(0);
        assertEquals(otherModel.getId(), answer.getAiModelId());
        assertEquals(overrides.getProjectId(), answer.getProjectId());
        assertEquals(overrides.getCreatedByAgentUserId(), answer.getCreatedBy());
        ArgumentCaptor<AuditLogs> logs = ArgumentCaptor.forClass(AuditLogs.class);
        verify(auditLogsService, times(2)).saveAuditLogs(logs.capture());
        assertEquals(overrides.getOrganizationId(), logs.getValue().getOrganizationId());
    }

    @ParameterizedTest
    @ValueSource(strings = {"systemPrompt", "completionModelName", "maxTokens", "temperature", "topP",
            "projectId", "organizationId", "createdByAgentUserId"})
    void aCallerWithoutAProjectMustGiveEachValue(String missing) throws Exception {
        CompletionRuntimeOverridesDTO overrides = withoutProject().build();
        ReflectionTestUtils.setField(overrides, missing, null);

        GendoxException error = assertThrows(GendoxException.class,
                () -> service.getCompletion(question, List.of(), null, overrides));

        assertEquals("COMPLETION_RUNTIME_OVERRIDE_REQUIRED", error.getErrorCode());
        assertTrue(error.getErrorMessage().endsWith(missing), error.getErrorMessage());
        assertTrue(sentMessages.isEmpty());
    }

    @Test
    void whatTheCallerGivesWinsOverTheAgent() throws Exception {
        agent.getAiTools().add(tool("agent_tool", null));
        CompletionRuntimeOverridesDTO overrides = withoutProject()
                .projectId(null).organizationId(null).createdByAgentUserId(null)
                .aiTools(List.of(tool("kept", null), tool("removed", null)))
                .excludedToolNames(List.of("removed"))
                .build();
        respondWithAnswer();

        List<Message> messages = service.getCompletion(question, List.of(), project, null, overrides);

        assertEquals("You are someone else.", sentSystemPrompts.get(0));
        assertSame(otherModel, sentModels.get(0));
        assertEquals("given-key", sentApiKeys.get(0));
        assertEquals(50L, sentParams.get(0).getMaxTokens());
        assertEquals(List.of("kept"), toolNames(sentTools.get(0)));
        // the project, the organization and the agent's user stay the project's
        assertEquals(project.getId(), messages.get(0).getProjectId());
        assertEquals(agent.getUserId(), messages.get(0).getCreatedBy());
    }

    // ------------------------------------------------------------------ stopping

    @Test
    void aFlaggedQuestionIsRefusedBeforeAnyModelCall() throws Exception {
        agent.setModerationCheck(true);
        when(organizationModelKeyService.getDefaultKeyForAgent(agent, "MODERATION_MODEL")).thenReturn("moderation-key");
        when(trainingService.getModeration(eq("Q:What is new? C:"), eq("moderation-key"), any())).thenReturn(
                ModerationResponse.builder().results(List.of(ModerationResponse.Result.builder().flagged(true).build())).build());

        GendoxException error = assertThrows(GendoxException.class,
                () -> service.getCompletion(question, List.of(), project, null));

        assertEquals("MODERATION_CHECK_FAILED", error.getErrorCode());
        assertTrue(sentMessages.isEmpty());
        verify(messageService, never()).createMessage(any());
    }

    @Test
    void aCancelledTokenStopsTheLoopBeforeTheModelCall() {
        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder()
                .cancellationToken(new CancellationToken(() -> true))
                .build();

        GendoxException error = assertThrows(GendoxException.class,
                () -> service.getCompletion(question, List.of(), project, null, overrides));

        assertEquals("DEEP_THINKING_CANCELLED", error.getErrorCode());
        assertTrue(sentMessages.isEmpty());
    }

    @Test
    void aCallerWithACancellationTokenGetsTwentyRoundsAndItsToolsGetTheToken() throws Exception {
        agent.getAiTools().add(tool("lookup", null));
        when(aiToolRegistry.supports("lookup")).thenReturn(true);
        CancellationToken token = new CancellationToken(() -> false);
        CompletionRuntimeOverridesDTO overrides = CompletionRuntimeOverridesDTO.builder().cancellationToken(token).build();
        for (int i = 0; i < 25; i++) {
            respondWithToolCall("lookup");
        }

        List<Message> messages = service.getCompletion(question, List.of(), project, null, overrides);

        assertEquals(20, sentMessages.size());
        assertEquals("tool", messages.getLast().getRole());
        ArgumentCaptor<ToolExecutionContext> context = ArgumentCaptor.forClass(ToolExecutionContext.class);
        verify(aiToolRegistry, times(20)).execute(eq("lookup"), any(), context.capture());
        assertSame(token, context.getValue().cancellationToken());
    }

    @Test
    void theModelIsWarnedBeforeItsLastAllowedCall() throws Exception {
        ReflectionTestUtils.setField(service, "maxToolIterations", 3);
        agent.getAiTools().add(tool("lookup", null));
        for (int i = 0; i < 5; i++) {
            respondWithToolCall("lookup");
        }

        service.getCompletion(question, List.of(), project, null);

        assertEquals(3, sentMessages.size());
        assertEquals("tool", sentMessages.get(1).getLast().getRole());
        AiModelMessage warning = sentMessages.get(2).getLast();
        assertEquals("user", warning.getRole());
        assertTrue(warning.getContent().startsWith("SYSTEM WARNING"));
    }

    @Test
    void aClientToolInTheLastAllowedRoundIsNotWaitedFor() throws Exception {
        ReflectionTestUtils.setField(service, "maxToolIterations", 1);
        agent.getAiTools().add(tool("lookup", "CLIENT"));
        respondWithToolCall("lookup");

        List<Message> messages = service.getCompletion(question, List.of(), project, null, null, new CompletionListener(true));

        assertEquals(List.of("assistant", "tool"), roles(messages));
        assertEquals("{\"status\":\"executed\"}", messages.getLast().getValue());
        verify(completionTurnService, never()).suspend(any(), any(), anyList(), anyInt());
    }

    // ------------------------------------------------------------------ the listener

    /** Records what a streaming client would be told. */
    private static class RecordingListener extends CompletionListener {
        final List<Message> messages = new ArrayList<>();
        final List<JsonNode> clientToolCalls = new ArrayList<>();
        final Consumer<CompletionDelta> deltas = delta -> {
        };

        RecordingListener() {
            super(false);
        }

        @Override
        public Consumer<CompletionDelta> deltas() {
            return deltas;
        }

        @Override
        public void onMessage(Message message) {
            messages.add(message);
        }

        @Override
        public void onClientToolCalls(Message assistant, List<JsonNode> toolCalls) {
            clientToolCalls.addAll(toolCalls);
        }
    }

    @Test
    void theListenerHearsEverySavedMessageAndTheCallsThePageActsOn() throws Exception {
        agent.getAiTools().add(tool("lookup", null));
        agent.getAiTools().add(tool("open_page", "ACTION"));
        when(aiToolRegistry.supports("lookup")).thenReturn(true);
        respondWithToolCalls(toolCall("call-1", "lookup", "{}"), toolCall("call-2", "open_page", "{}"));
        respondWithAnswer();
        RecordingListener listener = new RecordingListener();

        List<Message> messages = service.getCompletion(question, List.of(), project, null, null, listener);

        assertEquals(messages, listener.messages);
        assertEquals(List.of("assistant", "tool", "tool", "assistant"), roles(listener.messages));
        // only the call without a handler in Gendox is the page's
        assertEquals(List.of("call-2"), listener.clientToolCalls.stream().map(call -> call.get("id").asText()).toList());
        assertNull(listener.getWaitingTurn());
    }

    @Test
    void theListenersDeltasAndTheResponseSchemaReachTheModel() throws Exception {
        ObjectNode schema = mapper.createObjectNode().put("name", "answer");
        RecordingListener listener = new RecordingListener();
        respondWithAnswer();

        service.getCompletion(question, List.of(), project, schema, null, listener);

        assertSame(schema, sentSchemas.get(0));
        assertSame(listener.deltas, sentDeltas.get(0));
    }

    @Test
    void aCallerWithoutAListenerDoesNotStream() throws Exception {
        respondWithAnswer();

        service.getCompletion(question, List.of(), project, null);

        assertNull(sentSchemas.get(0));
        assertNull(sentDeltas.get(0));
    }
}
