package dev.ctrlspace.gendox.gendoxcoreapi.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.model.dtos.CompletionMessageDTO;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** The chat path of CompletionService: search mode, the answer's sources, and turns that wait for client tools. */
class CompletionServiceChatTest {

    final ObjectMapper mapper = new ObjectMapper();
    final UUID chatTemplateId = UUID.randomUUID();
    final UUID sectionTemplateId = UUID.randomUUID();
    final EmbeddingService embeddingService = mock(EmbeddingService.class);
    final TemplateRepository templateRepository = mock(TemplateRepository.class);
    final TypeService typeService = mock(TypeService.class);
    final AiModelUtils aiModelUtils = mock(AiModelUtils.class);
    final MessageService messageService = mock(MessageService.class);
    final AuditLogsService auditLogsService = mock(AuditLogsService.class);
    final AiToolRegistry aiToolRegistry = mock(AiToolRegistry.class);
    final CompletionTurnService completionTurnService = mock(CompletionTurnService.class);
    final AiModelApiAdapterService adapter = mock(AiModelApiAdapterService.class);
    // Each model call: what it was sent, and the responses it returns in turn
    final List<List<AiModelMessage>> sentMessages = new ArrayList<>();
    final List<String> sentSystemPrompts = new ArrayList<>();
    final List<List<AiTools>> sentTools = new ArrayList<>();
    final List<String> sentToolChoices = new ArrayList<>();
    final Queue<CompletionResponse> responses = new LinkedList<>();

    final Project project = new Project();
    final ProjectAgent agent = new ProjectAgent();
    CompletionService service;
    Message question;

    @BeforeEach
    void setup() throws Exception {
        project.setId(UUID.randomUUID());
        project.setOrganizationId(UUID.randomUUID());
        project.setProjectAgent(agent);
        agent.setProject(project);
        agent.setUserId(UUID.randomUUID());
        agent.setAgentBehavior("Be helpful");
        agent.setChatTemplateId(chatTemplateId);
        agent.setSectionTemplateId(sectionTemplateId);
        agent.setMaxSearchLimit(5L);
        agent.setMaxCompletionLimit(1L);
        agent.setMaxToken(1000L);
        agent.setTemperature(0.5);
        agent.setTopP(1.0);
        agent.setAiTools(new ArrayList<>());
        AiModel model = new AiModel();
        model.setId(UUID.randomUUID());
        Type apiType = new Type();
        apiType.setName("OPEN_AI_API");
        model.setApiType(apiType);
        agent.setCompletionModel(model);

        when(templateRepository.findByIdIs(chatTemplateId)).thenReturn(template("Q:${question} C:${context}"));
        when(templateRepository.findByIdIs(sectionTemplateId)).thenReturn(template("S:${sectionText}"));
        when(typeService.getAuditLogTypeByName(anyString())).thenReturn(new Type());
        when(auditLogsService.createDefaultAuditLogs(any())).thenReturn(new AuditLogs());
        when(aiModelUtils.getAiModelApiAdapterImpl(anyString())).thenReturn(adapter);
        when(aiToolRegistry.getOpenAiToolDefinitions("advanced_search")).thenReturn(
                (ArrayNode) mapper.readTree("[{\"function\":{\"name\":\"advanced_search\"}}]"));
        when(aiToolRegistry.execute(anyString(), any(), any())).thenReturn(mapper.readTree("{\"status\":\"executed\"}"));
        when(adapter.askCompletion(anyList(), any(), any(), any(), any(), anyList(), any(), any(), any())).thenAnswer(invocation -> {
            sentMessages.add(new ArrayList<>(invocation.<List<AiModelMessage>>getArgument(0)));
            sentSystemPrompts.add(invocation.getArgument(1));
            sentTools.add(new ArrayList<>(invocation.<List<AiTools>>getArgument(5)));
            sentToolChoices.add(invocation.getArgument(6));
            return responses.remove();
        });
        when(messageService.createMessage(any())).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.now());
            return message;
        });
        when(messageService.getPreviousMessages(any(), anyInt())).thenReturn(new ArrayList<>());

        service = new CompletionService(null, mock(ProjectService.class), new MessageAiMessageConverter(), embeddingService,
                mock(ProjectAgentRepository.class), templateRepository, typeService, aiModelUtils, mock(ProjectAgentService.class),
                mock(TrainingService.class), mock(OrganizationModelKeyService.class), messageService, auditLogsService,
                mock(DocumentUtils.class), mapper, mock(AiModelService.class), aiToolRegistry, mock(SkillService.class));
        ReflectionTestUtils.setField(service, "self", service);
        ReflectionTestUtils.setField(service, "completionTurnService", completionTurnService);
        ReflectionTestUtils.setField(service, "messageLocalContextService", mock(MessageLocalContextService.class));

        question = new Message();
        question.setId(UUID.randomUUID());
        question.setThreadId(UUID.randomUUID());
        question.setValue("What is new?");
        question.setCreatedAt(Instant.now());
    }

    private static Template template(String text) {
        Template template = new Template();
        template.setText(text);
        return template;
    }

    private void respond(String finishReason, AiModelMessage message) {
        responses.add(CompletionResponse.builder()
                .usage(Usage.builder().promptTokens(1).completionTokens(1).totalTokens(2).build())
                .choices(List.of(Choice.builder().index(0).finishReason(finishReason).message(message).build()))
                .build());
    }

    private void respondWithAnswer() {
        respond("stop", AiModelMessage.builder().role("assistant").content("Answer").build());
    }

    private void respondWithToolCall(String toolName) throws Exception {
        respond("tool_calls", AiModelMessage.builder().role("assistant")
                .toolCalls(mapper.readTree("[{\"id\":\"call\",\"type\":\"function\",\"function\":{\"name\":\"" + toolName + "\",\"arguments\":\"{}\"}}]"))
                .build());
    }

    private List<String> toolNames(List<AiTools> tools) {
        return tools.stream().map(tool -> {
            try {
                return mapper.readTree(tool.getJsonSchema()).path("name").asText();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }).toList();
    }

    private Message saved(String role, String name, String value) {
        Message message = new Message();
        message.setId(UUID.randomUUID());
        message.setRole(role);
        message.setName(name);
        message.setValue(value);
        return message;
    }

    @Test
    void alwaysIsTheDefault() throws Exception {
        respondWithToolCall("advanced_search");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        assertEquals(List.of("required", "auto"), sentToolChoices);
    }

    @Test
    void autoTellsTheAgentToSearch() throws Exception {
        agent.setAdvancedSearchMode("AUTO");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        verify(embeddingService, never()).findClosestSections(any(), any(), any());
        assertEquals("Q:What is new? C:", sentMessages.get(0).getLast().getContent());
        assertEquals(List.of("advanced_search"), toolNames(sentTools.get(0)));
        assertEquals("auto", sentToolChoices.get(0));
        assertTrue(sentSystemPrompts.get(0).contains("call advanced_search unless"));
    }

    @Test
    void alwaysRequiresAToolCallOnlyOnTheFirstModelCall() throws Exception {
        agent.setAdvancedSearchMode("ALWAYS");
        respondWithToolCall("advanced_search");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        assertEquals(List.of("required", "auto"), sentToolChoices);
        assertTrue(sentSystemPrompts.get(0).contains("Always call advanced_search"));
    }

    @Test
    void offOffersNoSearch() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        assertTrue(sentTools.get(0).isEmpty());
        assertFalse(sentSystemPrompts.get(0).contains("advanced_search"));
    }

    @Test
    void theAnswersSourcesAreTheSectionsItsSearchesFound() throws Exception {
        UUID sectionId = UUID.randomUUID();
        Message answer = saved("assistant", null, "Answer");
        when(messageService.getMessagesAfter(question)).thenReturn(List.of(
                saved("assistant", null, ""),
                saved("tool", "advanced_search", "{\"sections\":[{\"section_id\":\"" + sectionId + "\",\"document_id\":\"" + UUID.randomUUID() + "\"}]}"),
                saved("tool", "lookup", "{\"sections\":[{\"section_id\":\"" + UUID.randomUUID() + "\"}]}"),
                answer));
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        verify(messageService).linkSections(eq(answer), argThat(links ->
                links.size() == 1 && links.get(0).getSectionId().equals(sectionId) && links.get(0).getCompletionParticipant()));
    }

    @Test
    void aTurnThatStillWaitsGetsNoSourcesYet() throws Exception {
        Message waiting = saved("assistant", null, "");
        waiting.setToolCalls(mapper.readTree("[{\"id\":\"call\"}]"));
        when(messageService.getMessagesAfter(question)).thenReturn(List.of(waiting));
        respondWithAnswer();

        service.getCompletionSearch(question, project);

        verify(messageService, never()).linkSections(any(), any());
    }

    @Test
    void aClientToolTheClientAnswersSuspendsTheTurn() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        agent.getAiTools().add(AiTools.builder().type("function").execution("CLIENT").jsonSchema("{\"name\":\"lookup\"}").build());
        respondWithToolCall("lookup");
        CompletionTurn turn = new CompletionTurn();
        turn.setStatus(CompletionTurn.WAITING_FOR_TOOLS);
        turn.setUserMessageId(question.getId());
        turn.setResumeToken("token");
        when(completionTurnService.suspend(eq(question), any(), anyList(), eq(1))).thenReturn(turn);

        CompletionMessageDTO response = service.getCompletionSearch(question, project, new CompletionListener(true));

        assertEquals(1, sentMessages.size());
        assertEquals(CompletionTurn.WAITING_FOR_TOOLS, response.getStatus());
        assertEquals("token", response.getResumeToken());
        verify(aiToolRegistry, never()).execute(eq("lookup"), any(), any());
    }

    @Test
    void aClientThatCannotAnswerGetsTheToolToldItRan() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        agent.getAiTools().add(AiTools.builder().type("function").execution("CLIENT").jsonSchema("{\"name\":\"lookup\"}").build());
        respondWithToolCall("lookup");
        respondWithAnswer();

        CompletionMessageDTO response = service.getCompletionSearch(question, project);

        assertEquals(2, sentMessages.size());
        assertNull(response.getStatus());
        verify(completionTurnService, never()).suspend(any(), any(), anyList(), anyInt());
    }

    @Test
    void aResumedTurnContinuesAfterTheMessagesItAlreadyMade() throws Exception {
        agent.setAdvancedSearchMode("OFF");
        ProjectService projectService = (ProjectService) ReflectionTestUtils.getField(service, "projectService");
        when(projectService.getProjectById(project.getId())).thenReturn(project);
        when(messageService.getMessageWithLocalContexts(question.getId())).thenReturn(question);
        Message call = new Message();
        call.setRole("assistant");
        call.setToolCalls(mapper.readTree("[{\"id\":\"call\",\"function\":{\"name\":\"lookup\",\"arguments\":\"{}\"}}]"));
        Message result = new Message();
        result.setRole("tool");
        result.setToolCallId("call");
        result.setValue("{\"status\":\"shipped\"}");
        when(messageService.getMessagesAfter(question)).thenReturn(List.of(call, result));
        CompletionTurn turn = new CompletionTurn();
        turn.setProjectId(project.getId());
        turn.setUserMessageId(question.getId());
        turn.setIteration(1);
        respondWithAnswer();

        service.resumeCompletionSearch(turn, CompletionListener.none());

        List<AiModelMessage> sent = sentMessages.get(0);
        assertEquals("Q:What is new? C:", sent.get(0).getContent());
        assertEquals("assistant", sent.get(1).getRole());
        assertEquals("{\"status\":\"shipped\"}", sent.get(2).getContent());
    }
}
