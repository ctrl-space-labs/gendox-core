package dev.ctrlspace.gendox.gendoxcoreapi.services;

import tools.jackson.databind.json.JsonMapper;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelMessage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.AiModelRequestParams;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.generic.CompletionResponse;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Choice;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.model.dtos.openai.response.Usage;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.services.AiModelApiAdapterService;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.streaming.CompletionDelta;
import dev.ctrlspace.gendox.gendoxcoreapi.ai.engine.tools.engine.AiToolRegistry;
import dev.ctrlspace.gendox.gendoxcoreapi.converters.MessageAiMessageConverter;
import dev.ctrlspace.gendox.gendoxcoreapi.exceptions.ToolsHandlerAdvice;
import dev.ctrlspace.gendox.gendoxcoreapi.model.*;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.ProjectAgentRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.repositories.TemplateRepository;
import dev.ctrlspace.gendox.gendoxcoreapi.services.skills.SkillService;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.AiModelUtils;
import dev.ctrlspace.gendox.gendoxcoreapi.utils.DocumentUtils;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.UUID;
import java.util.function.Consumer;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * A CompletionService over mocks, for the tests of its loop and of its chat path: an agent in a
 * project, a question, and a model that returns the queued responses and records what it was sent.
 */
abstract class CompletionServiceFixture {

    final ObjectMapper mapper = JsonMapper.shared();
    final UUID chatTemplateId = UUID.randomUUID();
    final UUID sectionTemplateId = UUID.randomUUID();
    final EmbeddingService embeddingService = mock(EmbeddingService.class);
    final TemplateRepository templateRepository = mock(TemplateRepository.class);
    final TypeService typeService = mock(TypeService.class);
    final AiModelUtils aiModelUtils = mock(AiModelUtils.class);
    final TrainingService trainingService = mock(TrainingService.class);
    final OrganizationModelKeyService organizationModelKeyService = mock(OrganizationModelKeyService.class);
    final MessageService messageService = mock(MessageService.class);
    final AuditLogsService auditLogsService = mock(AuditLogsService.class);
    final AiModelService aiModelService = mock(AiModelService.class);
    final AiToolRegistry aiToolRegistry = mock(AiToolRegistry.class);
    final CompletionTurnService completionTurnService = mock(CompletionTurnService.class);
    final AiModelApiAdapterService adapter = mock(AiModelApiAdapterService.class);
    // Each model call: what it was sent, and the responses it returns in turn
    final List<List<AiModelMessage>> sentMessages = new ArrayList<>();
    final List<String> sentSystemPrompts = new ArrayList<>();
    final List<AiModel> sentModels = new ArrayList<>();
    final List<AiModelRequestParams> sentParams = new ArrayList<>();
    final List<String> sentApiKeys = new ArrayList<>();
    final List<List<AiTools>> sentTools = new ArrayList<>();
    final List<String> sentToolChoices = new ArrayList<>();
    final List<ObjectNode> sentSchemas = new ArrayList<>();
    final List<Consumer<CompletionDelta>> sentDeltas = new ArrayList<>();
    final Queue<CompletionResponse> responses = new LinkedList<>();

    final Project project = new Project();
    final ProjectAgent agent = new ProjectAgent();
    final AiModel model = new AiModel();
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
        model.setId(UUID.randomUUID());
        model.setApiType(apiType());
        agent.setCompletionModel(model);

        when(templateRepository.findByIdIs(chatTemplateId)).thenReturn(template("Q:${question} C:${context}"));
        when(templateRepository.findByIdIs(sectionTemplateId)).thenReturn(template("S:${sectionText}"));
        when(typeService.getAuditLogTypeByName(anyString())).thenReturn(new Type());
        when(auditLogsService.createDefaultAuditLogs(any())).thenAnswer(invocation -> new AuditLogs());
        when(aiModelUtils.getAiModelApiAdapterImpl(anyString())).thenReturn(adapter);
        when(aiToolRegistry.getOpenAiToolDefinitions("advanced_search")).thenReturn(
                (ArrayNode) mapper.readTree("[{\"function\":{\"name\":\"advanced_search\"}}]"));
        when(aiToolRegistry.execute(anyString(), any(), any())).thenReturn(mapper.readTree("{\"status\":\"executed\"}"));
        when(adapter.askCompletion(anyList(), any(), any(), any(), any(), anyList(), any(), any(), any())).thenAnswer(invocation -> {
            sentMessages.add(new ArrayList<>(invocation.<List<AiModelMessage>>getArgument(0)));
            sentSystemPrompts.add(invocation.getArgument(1));
            sentModels.add(invocation.getArgument(2));
            sentParams.add(invocation.getArgument(3));
            sentApiKeys.add(invocation.getArgument(4));
            sentTools.add(new ArrayList<>(invocation.<List<AiTools>>getArgument(5)));
            sentToolChoices.add(invocation.getArgument(6));
            sentSchemas.add(invocation.getArgument(7));
            sentDeltas.add(invocation.getArgument(8));
            return responses.remove();
        });
        when(messageService.createMessage(any())).thenAnswer(invocation -> {
            Message message = invocation.getArgument(0);
            message.setId(UUID.randomUUID());
            message.setCreatedAt(Instant.now());
            return message;
        });
        when(messageService.getPreviousMessages(any(), anyInt())).thenAnswer(invocation -> new ArrayList<>());

        CompletionRuntimeContextResolver contextResolver = new CompletionRuntimeContextResolver(templateRepository, typeService,
                embeddingService, mock(DocumentUtils.class), mapper, aiModelService, aiToolRegistry, mock(SkillService.class));
        service = new CompletionService(null, mock(ProjectService.class), new MessageAiMessageConverter(),
                mock(ProjectAgentRepository.class), typeService, aiModelUtils, mock(ProjectAgentService.class),
                trainingService, organizationModelKeyService, messageService, auditLogsService,
                mapper, aiToolRegistry, contextResolver, new ToolExecutionService(aiToolRegistry, mapper, new ToolsHandlerAdvice()));
        ReflectionTestUtils.setField(service, "self", service);
        ReflectionTestUtils.setField(service, "completionTurnService", completionTurnService);
        ReflectionTestUtils.setField(service, "messageLocalContextService", mock(MessageLocalContextService.class));

        question = new Message();
        question.setId(UUID.randomUUID());
        question.setThreadId(UUID.randomUUID());
        question.setValue("What is new?");
        question.setCreatedAt(Instant.now());
    }

    static Type apiType() {
        Type apiType = new Type();
        apiType.setName("OPEN_AI_API");
        return apiType;
    }

    static Template template(String text) {
        Template template = new Template();
        template.setText(text);
        return template;
    }

    static AiTools tool(String name, String execution) {
        return AiTools.builder().type("function").execution(execution).jsonSchema("{\"name\":\"" + name + "\"}").build();
    }

    void respond(String finishReason, AiModelMessage message) {
        responses.add(CompletionResponse.builder()
                .usage(Usage.builder().promptTokens(1).completionTokens(1).totalTokens(2).build())
                .choices(List.of(Choice.builder().index(0).finishReason(finishReason).message(message).build()))
                .build());
    }

    void respondWithAnswer() {
        respond("stop", AiModelMessage.builder().role("assistant").content("Answer").build());
    }

    void respondWithToolCall(String toolName) throws Exception {
        respondWithToolCalls(toolCall("call", toolName, "{}"));
    }

    void respondWithToolCalls(String... toolCalls) throws Exception {
        respond("tool_calls", AiModelMessage.builder().role("assistant")
                .toolCalls(mapper.readTree("[" + String.join(",", toolCalls) + "]"))
                .build());
    }

    /** One call of an assistant message; {@code arguments} is the JSON string a provider sends. */
    String toolCall(String id, String toolName, String arguments) throws Exception {
        ObjectNode call = mapper.createObjectNode().put("id", id).put("type", "function");
        call.putObject("function").put("name", toolName).put("arguments", arguments);
        return mapper.writeValueAsString(call);
    }

    List<String> toolNames(List<AiTools> tools) {
        return tools.stream().map(tool -> {
            try {
                return mapper.readTree(tool.getJsonSchema()).path("name").asText();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }).toList();
    }
}
