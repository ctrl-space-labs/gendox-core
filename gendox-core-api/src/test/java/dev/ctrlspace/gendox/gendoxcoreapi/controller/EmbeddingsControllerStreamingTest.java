package dev.ctrlspace.gendox.gendoxcoreapi.controller;

import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageLocalContextConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.*;
import dev.ctrlspace.gendox.gendoxcoreapi.services.chat.*;
import dev.ctrlspace.gendox.spring.batch.services.DeepThinkingBatchService;
import org.junit.jupiter.api.*;
import org.springframework.batch.core.JobExecution;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.concurrent.atomic.AtomicReference;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class EmbeddingsControllerStreamingTest {
    final UUID projectId = UUID.randomUUID();
    final UUID threadId = UUID.randomUUID();
    final ProjectService projects = mock(ProjectService.class);
    final SubscriptionValidationService subscriptions = mock(SubscriptionValidationService.class);
    final MessageLocalContextConverter contextConverter = mock(MessageLocalContextConverter.class);
    final MessageLocalContextService contexts = mock(MessageLocalContextService.class);
    final MessageService messages = mock(MessageService.class);
    final DeepThinkingBatchService deep = mock(DeepThinkingBatchService.class);
    final ChatCompletionService chat = mock(ChatCompletionService.class);
    final ChatCompletionRun run = mock(ChatCompletionRun.class);
    final AtomicReference<BiConsumer<String,Object>> events = new AtomicReference<>();
    MockMvc mvc;
    @BeforeEach void setup() throws Exception {
        Project project = new Project(); project.setId(projectId); project.setOrganizationId(UUID.randomUUID());
        ProjectAgent agent = new ProjectAgent(); agent.setCompletionModel(new AiModel()); project.setProjectAgent(agent);
        when(projects.getProjectById(projectId)).thenReturn(project);
        when(subscriptions.canSendMessage(any(), any())).thenReturn(true);
        when(contextConverter.toEntities(any(), any())).thenReturn(List.of());
        when(contexts.buildContextsFromDocumentIds(any(), any(), anyString())).thenReturn(List.of());
        when(contexts.getImageContentPartsFromLocalContext(any())).thenReturn(List.of());
        var controller = new EmbeddingsController(mock(EmbeddingService.class), mock(TrainingService.class), mock(CompletionService.class),
                messages, mock(OrganizationModelKeyService.class), subscriptions, projects, contextConverter, contexts, deep);
        ReflectionTestUtils.setField(controller, "chatCompletions", chat);
        when(chat.begin(any(), any(), any(), any())).thenAnswer(i -> { events.set(i.getArgument(3)); return run; });
        when(chat.execute(run)).thenReturn(CompletionMessageDTO.builder().threadId(threadId).messages(List.of()).provenAiMetadata(List.of()).build());
        mvc = MockMvcBuilders.standaloneSetup(controller).build();
    }
    @Test void absentStreamFlagKeepsJsonResponseWithoutNewFields() throws Exception {
        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"question\"}"))
                .andExpect(status().isOk()).andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.threadId").value(threadId.toString())).andExpect(jsonPath("$.messages").isArray())
                .andExpect(jsonPath("$.status").doesNotExist()).andExpect(jsonPath("$.resumeToken").doesNotExist());
        verify(chat, never()).executeAsync(any());
    }
    @Test void streamsEventsOnTheSamePostEndpoint() throws Exception {
        doAnswer(i -> {
            events.get().accept("start", Map.of("threadId", threadId));
            events.get().accept("delta", Map.of("field", "value", "text", "token"));
            events.get().accept("done", Map.of("threadId", threadId, "messages", List.of())); return null;
        }).when(chat).executeAsync(run);
        MvcResult result = mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"question\",\"stream\":true}"))
                .andExpect(request().asyncStarted()).andReturn();
        mvc.perform(asyncDispatch(result)).andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM))
                .andExpect(header().string("X-Accel-Buffering", "no"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("event:delta")));
        verify(chat, never()).execute(any());
    }
    @Test void partialToolReplyCreatesNoUserMessageAndReturnsWaitingStatus() throws Exception {
        when(chat.status(threadId, "session")).thenReturn(Map.of("status", "WAITING_FOR_TOOLS"));
        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                .header("X-Gendox-Completion-Token", "session").contentType(MediaType.APPLICATION_JSON)
                .content("{\"threadId\":\"" + threadId + "\",\"role\":\"tool\",\"toolCallId\":\"call\",\"value\":\"result\",\"stream\":true}"))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.status").value("WAITING_FOR_TOOLS"));
        verify(messages, never()).createMessage(any()); verify(chat, never()).begin(any(), any(), any(), any());
    }
    @Test void deepThinkingKeepsAcceptedJobResponseAndBypassesStreaming() throws Exception {
        Message saved = new Message(); saved.setId(UUID.randomUUID()); saved.setThreadId(threadId);
        when(messages.createMessage(any())).thenReturn(saved);
        when(deep.runDeepThinking(any(), any(), any())).thenReturn(new JobExecution(77L));
        mvc.perform(post("/messages/completions").param("projectId", projectId.toString()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"value\":\"question\",\"deepThinking\":true,\"stream\":true}"))
                .andExpect(status().isAccepted()).andExpect(jsonPath("$.jobExecutionId").value(77));
        verify(chat, never()).begin(any(), any(), any(), any()); verify(chat, never()).executeAsync(any());
    }
    @Test void attachmentOnlyMessagesRemainSupported() throws Exception {
        mvc.perform(post("/messages/completions").param("projectId", projectId.toString())
                .contentType(MediaType.APPLICATION_JSON).content("{\"value\":\"\",\"documentInstanceIds\":[\"" + UUID.randomUUID() + "\"]}"))
                .andExpect(status().isOk());
    }
}
