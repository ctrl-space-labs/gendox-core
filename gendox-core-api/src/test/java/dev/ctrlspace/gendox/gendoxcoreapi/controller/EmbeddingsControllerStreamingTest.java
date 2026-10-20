package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageLocalContextConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.AiModel;
import dev.ctrlspace.gendox.gendoxcoreapi.model.CompletionTurn;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Message;
import dev.ctrlspace.gendox.gendoxcoreapi.model.Project;
import dev.ctrlspace.gendox.gendoxcoreapi.model.ProjectAgent;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionStatusDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.spring.batch.services.DeepThinkingBatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.batch.core.JobExecution;
import org.springframework.core.task.TaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** JSON and SSE answers come from the same completion; the stream flag only picks the transport. */
class EmbeddingsControllerStreamingTest {

    final UUID projectId = UUID.randomUUID();
    final UUID threadId = UUID.randomUUID();
    final Project project = new Project();
    final Message saved = new Message();
    final ProjectService projects = mock(ProjectService.class);
    final SubscriptionValidationService subscriptions = mock(SubscriptionValidationService.class);
    final MessageLocalContextConverter contextConverter = mock(MessageLocalContextConverter.class);
    final MessageLocalContextService contexts = mock(MessageLocalContextService.class);
    final MessageService messages = mock(MessageService.class);
    final CompletionService completions = mock(CompletionService.class);
    final CompletionTurnService turns = mock(CompletionTurnService.class);
    final DeepThinkingBatchService deep = mock(DeepThinkingBatchService.class);
    // Background work is collected and run by the test, after the response has started
    final List<Runnable> background = new ArrayList<>();
    final TaskExecutor executor = background::add;
    MockMvc mvc;

    @BeforeEach
    void setup() throws Exception {
        project.setId(projectId);
        project.setOrganizationId(UUID.randomUUID());
        ProjectAgent agent = new ProjectAgent();
        agent.setCompletionModel(new AiModel());
        project.setProjectAgent(agent);
        saved.setId(UUID.randomUUID());
        saved.setThreadId(threadId);

        when(projects.getProjectById(projectId)).thenReturn(project);
        when(subscriptions.canSendMessage(any(), any())).thenReturn(true);
        when(contextConverter.toEntities(any(), any())).thenReturn(List.of());
        when(contexts.buildContextsFromDocumentIds(any(), any(), anyString())).thenReturn(List.of());
        when(contexts.getImageContentPartsFromLocalContext(any())).thenReturn(List.of());
        when(messages.createMessage(any())).thenReturn(saved);
        when(completions.getCompletionSearch(eq(saved), eq(project), any(CompletionListener.class)))
                .thenAnswer(invocation -> answer(invocation.getArgument(2)));

        EmbeddingsController controller = new EmbeddingsController(mock(EmbeddingService.class), mock(TrainingService.class), completions,
                messages, mock(OrganizationModelKeyService.class), subscriptions, projects, contextConverter, contexts, deep,
                turns, executor);
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    // Streams one token, as a provider would, then returns the answer
    private CompletionMessageDTO answer(CompletionListener listener) {
        if (listener.deltas() != null) {
            listener.deltas().accept(new CompletionDelta("value", "token"));
        }
        return CompletionMessageDTO.builder().threadId(threadId).messages(List.of()).provenAiMetadata(List.of()).build();
    }

    @Test
    void withoutStreamFlagAnswersJsonInTheRequest() throws Exception {
        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"question\"}"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.threadId").value(threadId.toString()))
                .andExpect(jsonPath("$.status").doesNotExist())
                .andExpect(jsonPath("$.resumeToken").doesNotExist());

        verify(completions).getCompletionSearch(eq(saved), eq(project),
                argThat(listener -> !(listener instanceof SseCompletionListener) && !listener.waitsForClientTools()));
        assertFalse(background.iterator().hasNext());
    }

    @Test
    void withStreamFlagRunsTheSameCompletionInTheBackgroundAndStreamsIt() throws Exception {
        MvcResult result = mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"question\",\"stream\":true,\"clientToolResults\":true}"))
                .andExpect(request().asyncStarted())
                .andReturn();
        background.forEach(Runnable::run);

        mvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andExpect(header().string("X-Accel-Buffering", "no"))
                .andExpect(content().string(containsString("event:start")))
                .andExpect(content().string(containsString("event:delta")))
                .andExpect(content().string(containsString("event:done")));
        verify(completions).getCompletionSearch(eq(saved), eq(project),
                argThat(listener -> listener instanceof SseCompletionListener && listener.waitsForClientTools()));
    }

    @Test
    void aToolResultThatIsNotTheLastReturnsTheWaitingStatus() throws Exception {
        when(turns.saveResult(threadId, "call", "{\"status\":\"shipped\"}", projectId, "session")).thenReturn(Optional.empty());
        when(turns.getStatus(threadId, "session")).thenReturn(CompletionStatusDTO.of(threadId, CompletionTurn.WAITING_FOR_TOOLS));

        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                        .header("X-Gendox-Completion-Token", "session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"threadId\":\"" + threadId + "\",\"role\":\"tool\",\"toolCallId\":\"call\",\"value\":\"{\\\"status\\\":\\\"shipped\\\"}\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.status").value("WAITING_FOR_TOOLS"));

        verify(messages, never()).createMessage(any());
        verify(completions, never()).getCompletionSearch(any(), any(), any());
        verify(completions, never()).resumeCompletionSearch(any(), any());
    }

    @Test
    void theLastToolResultResumesTheTurn() throws Exception {
        CompletionTurn turn = new CompletionTurn();
        turn.setUserMessageId(saved.getId());
        when(turns.saveResult(eq(threadId), eq("call"), eq("done"), eq(projectId), any())).thenReturn(Optional.of(turn));
        when(messages.getMessageById(saved.getId())).thenReturn(saved);
        when(completions.resumeCompletionSearch(eq(turn), any())).thenReturn(CompletionMessageDTO.builder().threadId(threadId).build());

        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"threadId\":\"" + threadId + "\",\"role\":\"tool\",\"toolCallId\":\"call\",\"value\":\"done\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.threadId").value(threadId.toString()));

        verify(completions).resumeCompletionSearch(eq(turn), argThat(CompletionListener::waitsForClientTools));
        verify(messages, never()).createMessage(any());
    }

    @Test
    void deepThinkingKeepsItsAcceptedJobResponse() throws Exception {
        when(deep.runDeepThinking(any(), any(), any())).thenReturn(new JobExecution(77L));

        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"value\":\"question\",\"deepThinking\":true,\"stream\":true}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.jobExecutionId").value(77));

        verify(completions, never()).getCompletionSearch(any(), any(), any());
        assertFalse(background.iterator().hasNext());
    }
}
